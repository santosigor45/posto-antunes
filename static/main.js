document.addEventListener('DOMContentLoaded', function () {
    atualizarData();
    highlightActiveNavbarItem();
    exibirModal();
    exibirMensagemPersonalizada();
    setupFormListeners();
    setupMotoristaInput();
    setupPlacaInput();
    adminLoader();
});

// Add focus event listeners to all input fields to ensure they scroll into view.
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('focus', scrollToView);
});

const enviarBtn = document.getElementById('enviar-btn');
const camposDoFormulario = document.querySelectorAll('input, select');

// Disable the send button shortly after click to prevent multiple submissions.
if (enviarBtn) {
    enviarBtn.addEventListener('click', function () {
        setTimeout(function () {
            enviarBtn.disabled = true;
        }, 100);
    });

    camposDoFormulario.forEach(function (campo) {
        campo.addEventListener('input', function () {
            enviarBtn.disabled = false;
        });
    });
}

// Check server availability.
function checkServerAvailability() {
    return fetch('/ping')
        .then(response => response.ok ? true : false)
        .catch(() => false);
}

// Scroll the active element smoothly into view after a delay.
function scrollToView(event) {
    var activeElement = event.target;
    setTimeout(() => {
        activeElement.scrollIntoView({behavior: 'smooth', block: 'center'});
    }, 300);
}

// Modify admin-specific links if the user is an administrator.
function adminLoader() {
    var userContainer = document.getElementById('username-link')
    if (typeof isAdmin !== 'undefined' && isAdmin) {
        if (isAdmin === true) {
            userContainer.setAttribute('href', "/admin")
        }
    }
}

// Set up event listeners for forms to handle submissions and interact with the server.
function setupFormListeners() {
    document.querySelectorAll('form.dados').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var formData = new FormData(this);
            formData.append('formulario_id', form.getAttribute('id'));

            sendDataToServer('/processar_formulario', formData)
                .then(({ message, type }) => {
                    exibirMensagemFlash(message, type);
                    limparFormulario(form.getAttribute('id'));
                })
                .catch(error => {
                    salvarNoIndexDB({ url: '/processar_formulario', data: formDataToObject(formData) });
                    exibirMensagemFlash('Dados armazenados. Eles serão enviados quando a conexão for restabelecida.', 'info');
                    limparFormulario(form.getAttribute('id'));
                });
        });
    });
}

// Send form data to server and handle the response.
function sendDataToServer(url, formData) {
    return fetch(url, { method: 'POST', body: formData }).then(response => response.json());
}

// Open IndexedDB to store data if the server cannot be reached.
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        var request = indexedDB.open("formularioDB", 1);
        request.onupgradeneeded = function (event) {
            var db = event.target.result;
            if (!db.objectStoreNames.contains("formularioStore")) {
                db.createObjectStore("formularioStore", { keyPath: "id", autoIncrement: true });
            }
        };
        request.onsuccess = function (event) {
            resolve(event.target.result);
        };

        request.onerror = function (event) {
            reject("Erro ao abrir o banco de dados: " + event.target.errorCode);
        };
    });
}

// Store unsent data in IndexedDB and log success or error.
function salvarNoIndexDB(data) {
    openIndexedDB()
        .then(db => {
            var transaction = db.transaction(["formularioStore"], "readwrite");
            var objectStore = transaction.objectStore("formularioStore");
            objectStore.add(data);
            return transaction.complete;
        })
        .then(() => console.log('Dados salvos no IndexedDB com sucesso.'))
        .catch(error => console.error('Erro ao salvar no IndexedDB:', error));
}

// Send cached data from IndexedDB to server when the connection is available.
function sendCachedData() {
    openIndexedDB()
        .then(db => {
            return new Promise((resolve, reject) => {
                var objectStore = db.transaction(["formularioStore"], "readwrite").objectStore("formularioStore");
                var request = objectStore.getAll();

                request.onsuccess = function(event) {
                    resolve(event.target.result);
                };

                request.onerror = function(event) {
                    reject("Erro ao obter dados em cache: " + event.target.errorCode);
                };
            });
        })
        .then(cachedData => {
            if (cachedData && cachedData.length > 0) {
                checkServerAvailability()
                    .then(serverAvailable => {
                        if (serverAvailable) {
                            sendCachedDataRecursiveStep(cachedData, 0);
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao verificar a disponibilidade do servidor:', error);
                    });
            }
        })
        .catch(error => console.error('Erro ao enviar dados em cache:', error));
}

// Recursive function to send each item of cached data to the server.
function sendCachedDataRecursiveStep(cachedData, index) {
    if (index < cachedData.length) {
        var item = cachedData[index];
        var formData = new FormData();

        for (var key in item.data) {
            formData.append(key, item.data[key]);
        }

        formData.append('formulario_id', item.formulario_id);

        sendDataToServer(item.url, formData)
            .then(({ message, type }) => {
                exibirMensagemFlash(message, type);
                return openIndexedDB();
            })
            .then(db => {
                var transaction = db.transaction(["formularioStore"], "readwrite");
                var objectStore = transaction.objectStore("formularioStore");
                objectStore.delete(item.id);
                return transaction.complete;
            })
            .then(() => {
                sendCachedDataRecursiveStep(cachedData, index + 1);
            })
            .catch(error => {
                exibirMensagemFlash(error.message, 'error');
            });
    }
}

// Convert FormData into a simple object.
function formDataToObject(formData) {
    var formDataObject = {};
    formData.forEach(function(value, key){
        formDataObject[key] = value;
    });
    return formDataObject;
}

function setupMotoristaInput() {
    var motorista = document.getElementById('motorista');
    var motoristaOptions = document.getElementById('motoristaOptions');

    if (!motoristaOptions) {
        return
    }

    var all_motoristas = Array.from(motoristaOptions.children);

    motorista.addEventListener('input', function() {
        motorista.value = motorista.value.toUpperCase().replace(/[0-9]/g, '');
        var valorAtual = motorista.value;
        motoristaOptions.innerHTML = '';

        filterAndDisplayOptions(valorAtual, all_motoristas, motorista, motoristaOptions);
    });

    motorista.addEventListener('blur', function() {
        setTimeout(function() {
            motoristaOptions.classList.remove('show');
        }, 300);
    });
}

function setupPlacaInput() {
    var placa = document.getElementById('placa');
    var placaOptions = document.getElementById('placaOptions');

    if (!placaOptions) {
        return
    }

    var all_placas = Array.from(placaOptions.children);

    placa.addEventListener('input', function() {
        placa.value = placa.value.toUpperCase();
        var valorAtual = placa.value;
        placaOptions.innerHTML = '';

        filterAndDisplayOptions(valorAtual, all_placas, placa, placaOptions);

        if (valorAtual.length <= 3) {
            placa.value = valorAtual.replace(/[^A-Z]/g, '');
        }
        else if (valorAtual.length === 4 && valorAtual.charAt(3) !== '-' && valorAtual.charAt(3) >= '0' && valorAtual.charAt(3) <= '9') {
            placa.value = valorAtual.substring(0, 3) + '-' + valorAtual.charAt(3);
        }
        else if (valorAtual.length === 6) {
            placa.value = valorAtual.substring(0, 5) + valorAtual.charAt(5).replace(/[^A-J0-9]/g, '');
        }
        else if (valorAtual.length >= 7) {
            placa.value = valorAtual.substring(0, 6) + valorAtual.charAt(6).replace(/[^0-9]/g, '') + valorAtual.charAt(7).replace(/[^0-9]/g, '');
        }
        else if (valorAtual.length === 4) {
            placa.value = valorAtual.slice(0, -1);
        }
    });

    placa.addEventListener('keydown', function(event) {
        var valorAtual = placa.value;

        if (event.key === 'Backspace') {
            if (valorAtual.length === 5) {
                placa.value = valorAtual.slice(0, -1);
            }
        }
    });

    placa.addEventListener('blur', function() {
        setTimeout(function() {
            placaOptions.classList.remove('show');
        }, 300);
    });
}

function filterAndDisplayOptions(valorAtual, allOptions, inputField, optionsContainer) {
    optionsContainer.innerHTML = '';

    if (valorAtual.length === 0) {
        optionsContainer.classList.remove('show');
        return;
    }

    const valorAtualUpper = valorAtual.toUpperCase();
    let matches = [];

    for (const option of allOptions) {
        const optionValue = option.innerText.toUpperCase();

        if (optionValue.includes(valorAtualUpper)) {
            const index = optionValue.indexOf(valorAtualUpper);
            matches.push({option, index});
        }
    }

    matches.sort((a, b) => a.index - b.index);

    for (const match of matches) {
        const clonedOption = match.option.cloneNode(true);
        optionsContainer.appendChild(clonedOption);

        clonedOption.addEventListener('click', function() {
            inputField.value = clonedOption.innerText;
            optionsContainer.classList.remove('show');
        });
    }

    optionsContainer.classList.add('show');
}

// Confirm the intention to clear the form data with a confirmation dialog.
function confirmarLimpeza(form) {
    var confirmar = confirm("Tem certeza que deseja limpar tudo?");
    if (confirmar) {
        limparFormulario(form);
    }
}

// Resets the form fields and updates the date to the current date.
function limparFormulario(form) {
    var formulario = document.getElementById(form);
    formulario.reset();
    atualizarData();
}

// Adjusts UI elements based on the selected fuel station name.
function verificarNomeDoPosto() {
    var valorSelecionado = document.getElementById("posto").value;

    if (valorSelecionado.toLowerCase().includes("bomba")) {
        document.getElementById("div-preco").style.display = "none";
        document.getElementById("div-combustivel").style.display = "none";
        document.getElementById("combustivel").selectedIndex = 1;
        document.getElementById("combustivel").required = false;
        document.getElementById("div-odometro").style.display = "block";
        document.getElementById("odometro").required = true;
    } else {
        document.getElementById("div-preco").style.display = "flex";
        document.getElementById("div-combustivel").style.display = "block";
        document.getElementById("combustivel").selectedIndex = 0;
        document.getElementById("combustivel").required = true;
        document.getElementById("div-odometro").style.display = "none";
        document.getElementById("odometro").required = false;
    }
}

// Validates and formats the vehicle plate input.
function verificarPlaca() {
    var placaElement = document.getElementById("placa");
    var kmElement = document.getElementById("quilometragem");
    if (placaElement.value == "SEM-PLACA") {
        placaElement.removeAttribute('pattern');
        placaElement.maxLength = "9"
        kmElement.required = false;
        document.getElementById("div-observacoes").style.display = "block";
        document.getElementById("observacoes").required = true;
    } else {
        placaElement.pattern = "[A-Z]{3}-\\d[A-j0-9]\\d{2}"
        placaElement.maxLength = "8"
        kmElement.required = true;
        document.getElementById("div-observacoes").style.display = "none";
        document.getElementById("observacoes").required = false;
    }
}

// Formats input values as currency.
function myCurrency(e) {
    var x = document.getElementById("preco");
    var currentVal = x.value;

    document.getElementById("preco").addEventListener('input', function (e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    if (currentVal == "") {
        x.value = "0,00";
    } else {
        var num = currentVal.replace(/,/g, '').replace(/^0+/, '');
        if(num == "") num = "0";
        var len = num.length;
        if(len == 1) num = "0,0" + num;
        else if(len == 2) num = "0," + num;
        else num = num.slice(0, len-2) + "," + num.slice(len-2);
        x.value = num;
    }
}

// Highlights the navbar item that corresponds to the current page URL.
function highlightActiveNavbarItem() {
    let currentUrl = window.location.href;
    let navbarItems = document.querySelectorAll(".navbar-nav .nav-link");
    navbarItems.forEach((navbarItem) => {
        if (currentUrl.includes(navbarItem.href)) {
            navbarItem.classList.add("active");
        }
    })
}

// Updates the date input field to today's date in ISO format.
function atualizarData() {
    var today = new Date();
    var offset = today.getTimezoneOffset() * 60000;
    var localISOTime = (new Date(today - offset)).toISOString().split('T')[0];
    dataElement = document.getElementById('data')
    if (dataElement) {
        dataElement.value = localISOTime;
    }
}

// Displays a personalized greeting based on the current time of day.
function exibirMensagemPersonalizada() {
    var agora = new Date();
    var hora = agora.getHours();
    var mensagem = hora < 12 ? "Bom dia, " : hora < 18 ? "Boa tarde, " : "Boa noite, ";
    var elementoMensagem = document.getElementById("welcome_message");
    if (elementoMensagem) {
        elementoMensagem.innerHTML = mensagem + elementoMensagem.innerHTML;
    }
}

// Displays a modal if there are any flash messages.
function exibirModal() {
    var modal = document.getElementById('myModal');
    var flashes = document.querySelector('.flashes');
    if (flashes && flashes.children.length > 0) {
        modal.classList.add('show');
        setTimeout(function () {
            fecharModal(modal_id);;
        }, 3000);
        window.addEventListener('click', function (event) {
            if (event.target === modal) {
                fecharModal(modal.getAttribute("id"));;
            }
        });
    }
}

// Displays and manages flash messages in a modal.
function exibirMensagemFlash(mensagem, tipo) {
    var modal = document.getElementById('jsModal');
    modal.classList.add('show');
    var flash_content = document.getElementById('js-flash-content');
    var flash_text = document.getElementById('js-flash-text');
    flash_text.classList.add("flash-text-" + tipo);
    flash_content.classList.add("flash-" + tipo);
    flash_text.innerHTML = mensagem;
    setTimeout(function () {
        flash_text.classList.remove("flash-text-" + tipo);
        flash_content.classList.remove("flash-" + tipo);
        fecharModal(modal.getAttribute("id"));
    }, 3000);
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            fecharModal(modal.getAttribute("id"));
        }
    });
}

// Closes the modal with a fade-out effect.
function fecharModal(modal_id) {
    var modal = document.getElementById(modal_id);
    modal.classList.add('fade-out');
    setTimeout(function () {
        modal.classList.remove('show', 'fade-out');
    }, 200);
}
