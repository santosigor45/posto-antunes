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

document.querySelectorAll('input').forEach(input => {
  input.addEventListener('focus', scrollToView);
});

const enviarBtn = document.getElementById('enviar-btn');

const camposDoFormulario = document.querySelectorAll('input, select');

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

function checkServerAvailability() {
    return fetch('/ping')
        .then(response => response.ok ? true : false)
        .catch(() => false);
}

function scrollToView(event) {
  // O elemento que recebeu o foco
  var activeElement = event.target;

  // Tempo de atraso para esperar o teclado aparecer
  setTimeout(() => {
    // Garantir que o elemento esteja na visualização
    activeElement.scrollIntoView({behavior: 'smooth', block: 'center'});
  }, 300); // Ajuste o tempo conforme necessário
}

function adminLoader() {
    var userContainer = document.getElementById('username-link')
    if (typeof isAdmin !== 'undefined' && isAdmin) {
        if (isAdmin === true) {
            userContainer.setAttribute('href', "/admin")
        }
    }
}

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

function sendDataToServer(url, formData) {
    return fetch(url, { method: 'POST', body: formData }).then(response => response.json());
}

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

function sendCachedDataRecursiveStep(cachedData, index) {
    if (index < cachedData.length) {
        var item = cachedData[index];
        var formData = new FormData();

        // Reconstruct the FormData object from the item data
        for (var key in item.data) {
            formData.append(key, item.data[key]);
        }

        // Ensure the formulario_id is appended to the FormData
        formData.append('formulario_id', item.formulario_id);

        sendDataToServer(item.url, formData)
            .then(({ message, type }) => {
                exibirMensagemFlash(message, type);
                return openIndexedDB();
            })
            .then(db => {
                var transaction = db.transaction(["formularioStore"], "readwrite");
                var objectStore = transaction.objectStore("formularioStore");
                objectStore.delete(item.id);  // Deletes the individual item after it's been sent.
                return transaction.complete;
            })
            .then(() => {
                sendCachedDataRecursiveStep(cachedData, index + 1);  // Proceeds to the next item.
            })
            .catch(error => {
                exibirMensagemFlash(error.message, 'error');
                // Optionally, handle re-trying failed requests or logging the error.
            });
    }
}

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

        // Permita apenas letras nos 3 primeiros caracteres
        if (valorAtual.length <= 3) {
            placa.value = valorAtual.replace(/[^A-Z]/g, '');
        }
        // Adicione um hífen antes do 4º caractere
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
            // Se o 5º caractere for deletado, remova o hífen
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

        // Verifica se a opção inclui o valor atual
        if (optionValue.includes(valorAtualUpper)) {
            const index = optionValue.indexOf(valorAtualUpper);
            // Quanto menor o índice, mais relevante é a opção
            matches.push({option, index});
        }
    }

    // Ordena as correspondências pelo índice
    matches.sort((a, b) => a.index - b.index);

    for (const match of matches) {
        const clonedOption = match.option.cloneNode(true);
        optionsContainer.appendChild(clonedOption);

        // Adiciona um evento de clique à opção
        clonedOption.addEventListener('click', function() {
            inputField.value = clonedOption.innerText;
            optionsContainer.classList.remove('show'); // Esconde as opções após a seleção
        });
    }

    optionsContainer.classList.add('show');
}

// Função para confirmar a limpeza do formulário
function confirmarLimpeza(form) {
    // Exibe a janela de confirmação
    var confirmar = confirm("Tem certeza que deseja limpar tudo?");
    // Se o usuário clicar em "OK", limpa o formulário
    if (confirmar) {
        limparFormulario(form);
    }
}

function limparFormulario(form) {
    var formulario = document.getElementById(form);
    formulario.reset();
    atualizarData();
}

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


function highlightActiveNavbarItem() {
    // Obtém o URL da página atual
    let currentUrl = window.location.href;

    // Obtém os itens da barra de navegação
    let navbarItems = document.querySelectorAll(".navbar-nav .nav-link");

    // Destaca o item que corresponde ao URL atual
    navbarItems.forEach((navbarItem) => {
        if (currentUrl.includes(navbarItem.href)) {
            navbarItem.classList.add("active");
        }
    })
}

function atualizarData() {
    var today = new Date();
    var offset = today.getTimezoneOffset() * 60000;
    var localISOTime = (new Date(today - offset)).toISOString().split('T')[0];
    dataElement = document.getElementById('data')
    if (dataElement) {
        dataElement.value = localISOTime;
    }
}

function exibirMensagemPersonalizada() {
    // Obtém a hora atual do sistema
    var agora = new Date();
    var hora = agora.getHours();

    // Seleciona a mensagem com base na hora
    if (hora < 12) {
        mensagem = "Bom dia, ";
    } else if (hora < 18) {
        mensagem = "Boa tarde, ";
    } else {
        mensagem = "Boa noite, ";
    }

    // Exibe a mensagem na página
    var elementoMensagem = document.getElementById("welcome_message");
    if (elementoMensagem) {
        elementoMensagem.innerHTML = mensagem + elementoMensagem.innerHTML;
    }
}

function exibirModal() {
    // Encontrar o modal pelo ID
    var modal = document.getElementById('myModal');

    // Verificar se há mensagens flash
    var flashes = document.querySelector('.flashes');
    if (flashes && flashes.children.length > 0) {
        // Exibir o modal se houver mensagens flash
        modal.classList.add('show');
        var modal_id = modal.getAttribute("id")

        // Adicionar um evento para fechar o modal após 2 segundos
        setTimeout(function () {
            fecharModal(modal_id);;
        }, 3000);

        // Adicionar um evento para fechar o modal quando clicar fora dele
        window.addEventListener('click', function (event) {
            if (event.target === modal) {
                fecharModal(modal_id);;
            }
        });
    }
}

function exibirMensagemFlash(mensagem, tipo) {
    var modal = document.getElementById('jsModal');
    var modal_id = modal.getAttribute("id")
    var flash_content = document.getElementById('js-flash-content');
    var flash_text = document.getElementById('js-flash-text');

    // Define o conteúdo da mensagem flash
    modal.classList.add('show');
    flash_text.classList.add("flash-text-" + tipo);
    flash_content.classList.add("flash-" + tipo);
    flash_text.innerHTML = mensagem;
    console.log(mensagem);

    // Adicionar um evento para fechar o modal após 3 segundos
    setTimeout(function () {
        flash_text.classList.remove("flash-text-" + tipo);
        flash_content.classList.remove("flash-" + tipo);
        fecharModal(modal_id);
    }, 3000);

    // Adicionar um evento para fechar o modal quando clicar fora dele
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            fecharModal(modal_id);
        }
    });
}

function fecharModal(modal_id) {
    var modal = document.getElementById(modal_id);

    // Adicionar uma classe para iniciar a transição
    modal.classList.add('fade-out');

    // Aguardar um pequeno atraso antes de remover a classe 'show'
    setTimeout(function () {
        modal.classList.remove('show', 'fade-out');
    }, 200);  // Ajuste o tempo conforme necessário
}
