/**
 * Dispara quando o DOM estiver completamente carregado.
 * Inicializa diversas funcionalidades da página.
 */
document.addEventListener('DOMContentLoaded', function () {
    updateDate();
    highlightActiveNavbarItem();
    showModal();
    showCustomMessage();
    setupFormListeners();
    setupMotoristaInput();
    setupPlacaInput();
    sendCachedData();
    adminLoader();
    setupSendButtonBehavior();

    // adiciona event listeners de foco para todos os inputs, ativando a função scrollToView
    document.querySelectorAll('input').forEach(input => {
      input.addEventListener('focus', scrollToView);
    });
});

/*************************************************************/
/*                   ENVIO DE FORMULÁRIO                     */
/*************************************************************/

/**
 * Inicializa listeners em todos os formulários (edit, delete, dados).
 */
function setupFormListeners() {
    document.querySelectorAll('form.edit, form.delete, form.dados').forEach(function (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            const formData = new FormData(this);
            const formId = form.getAttribute('id');
            const url = '/process_form/' +
                        (formId.startsWith('edit') ? 'edit/' :
                        formId.startsWith('delete') ? 'delete/' : 'send/') +
                        formId;

            // Regras de validacao
            let isValid = true;

            if (formId === 'abastecimentos') {
                isValid = await validateMileage() && await validateOdometer(formId);
            } else if (formId === 'entrega_combustivel') {
                isValid = await validateOdometer(formId);
            }

            if (isValid) {
                submitFormData(url, formData, form, formId);
            }
        });
    });
}

/**
 * Envia dados do formulário ao servidor e lida com a resposta.
 */
function submitFormData(url, formData, form, formId) {
    sendDataToServer(url, formData, form.getAttribute('method'))
        .then(({ message, type, error }) => {
            if (url.includes('send')) {
                formReset(formId);
            } else {
                $('.modal').modal('hide');
                $('#reload-table').click();
            }
            showFlashMessage(message, type);

            if (error) {
                console.log(error);
            }
        })
        .catch(error => {
            if (url.includes('send')) {
                showFlashMessage('Houve um erro. Por favor, verifique a conexão e tente novamente.', 'info');
            } else {
                $('.modal').modal('hide');
                showFlashMessage('Houve um erro. Por favor, verifique a conexão e tente novamente.', 'error');
            }
            console.log(error);
        });
}

/**
 * Requisição genérica ao servidor, usando fetch.
 */
function sendDataToServer(url, formData, method = 'POST') {
    if (method === 'GET') {
        return fetch(url, { method }).then((response) => response.json());
    }
    return fetch(url, { method, body: formData }).then((response) => response.json());
}


/*************************************************************/
/*               CONFIGURAÇÕES DE FORMULÁRIO                 */
/*************************************************************/

/**
 * Atualiza o campo de data para a data atual no formato ISO (yyyy-mm-dd).
 */
function updateDate() {
    var today = new Date();
    var offset = today.getTimezoneOffset() * 60000;
    var localISOTime = (new Date(today - offset)).toISOString().split('T')[0];
    dataElement = document.getElementById('data')
    if (dataElement) {
        dataElement.value = localISOTime;
    }
}

/**
 * Configura campo de input para motorista, exibindo opções filtradas.
 */
function setupMotoristaInput(field = 'motorista') {
    var motorista = document.getElementById(field);

    if (!motorista) {
        return
    }

    motorista.addEventListener('input', function() {
        setupOnlyLetters(field);
    });

    setupMotoristaOptions(field);
}

function setupMotoristaOptions(field) {
    var motoristaOptions = document.getElementById('motoristaOptions');

    if (!motoristaOptions) {
        return
    }

    var motorista = document.getElementById(field);
    var all_motoristas = Array.from(motoristaOptions.children);

    motorista.addEventListener('input', function() {
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

/**
 * Configura campo de input para placa, exibindo opções filtradas e formatando a digitação.
 */
function setupPlacaInput(field = 'placa') {
    var placa = document.getElementById(field);

    if (!placa) {
        return
    }

    placa.addEventListener('input', function() {
        placa.value = placa.value.toUpperCase();
        setupPlacaPattern(field);
    });

    setupPlacaOptions(field);
}

function setupPlacaOptions(field) {
    var placaOptions = document.getElementById('placaOptions');

    if (!placaOptions) {
        return
    }

    var placa = document.getElementById(field);
    var all_placas = Array.from(placaOptions.children);

    placa.addEventListener('input', function() {
        var valorAtual = placa.value;
        placaOptions.innerHTML = '';

        filterAndDisplayOptions(valorAtual, all_placas, placa, placaOptions);
    });

    placa.addEventListener('blur', function() {
        setTimeout(function() {
            placaOptions.classList.remove('show');
        }, 300);
    });
}

function setupPlacaPattern(field) {
    var placa = document.getElementById(field);
    var valorAtual = placa.value;

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

    placa.addEventListener('keydown', function(event) {
        var valorAtual = placa.value;

        if (event.key === 'Backspace') {
            if (valorAtual.length === 5) {
                placa.value = valorAtual.slice(0, -1);
            }
        }
    });
}

/**
 * Formata valor monetário no campo de preço.
 */
function setupPrecoInput(e, field = 'preco') {
    var x = document.getElementById(field);
    var currentVal = x.value;

    document.getElementById(field).addEventListener('input', function (e) {
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

/**
 * Filtra opções e exibe na tela, baseado no valor atual do input.
 */
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

    // Ordena resultados pelo índice de correspondência
    matches.sort((a, b) => a.index - b.index);

    for (const match of matches) {
        const clonedOption = match.option.cloneNode(true);
        optionsContainer.appendChild(clonedOption);

        clonedOption.addEventListener('click', function() {
            inputField.value = clonedOption.innerText.split(' |')[0];
            optionsContainer.classList.remove('show');
        });
    }

    optionsContainer.classList.add('show');
}

/**
 * Desabilita o botão de envio por um curto período para evitar envios duplicados.
 * Habilita novamente sempre que qualquer campo for alterado.
 */
function setupSendButtonBehavior() {
    const submitButton = document.getElementById('enviar-btn');
    const formFields = document.querySelectorAll('input, select');

    if (!submitButton) return;

    submitButton.addEventListener('click', () => {
        setTimeout(() => {
            submitButton.disabled = true;
        }, 100);
    });

    formFields.forEach((field) => {
        field.addEventListener('input', () => {
            submitButton.disabled = false;
        });
    });
}

/*************************************************************/
/*                VERIFICAÇÕES DE FORMULÁRIO                 */
/*************************************************************/

/**
 * Verifica a quilometragem inserida de forma assíncrona.
 */
async function validateMileage() {
    const placa = document.getElementById('placa').value;
    const kmField = document.getElementById('quilometragem');

    if (placa === 'SEM-PLACA') {
        return true;
    }

    try {
        const serverAvailable = await checkServerAvailability();
        if (serverAvailable) {
            try {
                const { message, result } = await sendDataToServer(
                    '/api/validate_mileage/' + placa + '/' + kmField.value,
                    null,
                    'GET'
                );
                if (!result) {
                    showFlashMessage(message, 'info');
                    kmField.focus();
                    return false;
                }
                return true;
            } catch (error) {
                console.error('Erro ao enviar dados ao servidor:', error);
                // Em caso de erro, permitir continuar
                return true;
            }
        } else {
            console.warn('Servidor indisponível. Permitindo operação.');
            return true;
        }
    } catch (error) {
        console.error('Erro ao verificar disponibilidade do servidor:', error);
        return true;
    }
}

/**
 * Verifica o odômetro inserido de forma assíncrona.
 */
async function validateOdometer(formID) {
    const posto = document.getElementById('posto').value;

    if (!posto.includes('BOMBA')) {
        return true;
    }

    const odometerField = document.getElementById('odometro');

    try {
        const serverAvailable = await checkServerAvailability();
        if (serverAvailable) {
            try {
                const { message, result } = await sendDataToServer(
                    '/api/validate_odometer/' + posto + '/' + odometerField.value + '/' + formId,
                    null,
                    'GET'
                );
                if (!result) {
                    showFlashMessage(message, 'info');
                    odometerField.focus();
                    return false;
                }
                return true;
            } catch (error) {
                console.error('Erro ao enviar dados ao servidor:', error);
                return true;
            }
        } else {
            console.warn('Servidor indisponível. Permitindo operação.');
            return true;
        }
    } catch (error) {
        console.error('Erro ao verificar disponibilidade do servidor:', error);
        return true;
    }
}

/**
 * Ajusta campo de preço, combustível e odômetro dependendo do posto selecionado.
 */
function validateStationName() {
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

/**
 * Formata o texto digitado em um campo de placa (AAA-0A00).
 */
function validateLicensePlate() {
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


/*************************************************************/
/*                        ESTÉTICA                           */
/*************************************************************/

/**
 * Faz a rolagem suave até o elemento focado após um leve atraso.
 */
function scrollToView(event) {
    var activeElement = event.target;
    setTimeout(() => {
        activeElement.scrollIntoView({behavior: 'smooth', block: 'center'});
    }, 300);
}

/**
 * Destaca o item do navbar correspondente à URL atual.
 */
function highlightActiveNavbarItem() {
    let currentUrl = window.location.href;
    let navbarItems = document.querySelectorAll(".navbar-nav .nav-link");
    navbarItems.forEach((navbarItem) => {
        if (currentUrl.includes(navbarItem.href)) {
            navbarItem.classList.add("active");
        }
    })
}

/**
 * Exibe saudação personalizada (Bom dia, Boa tarde, Boa noite).
 */
function showCustomMessage() {
    var agora = new Date();
    var hora = agora.getHours();
    var mensagem = hora < 12 ? "Bom dia, " : hora < 18 ? "Boa tarde, " : "Boa noite, ";
    var elementoMensagem = document.getElementById("welcome-message");
    if (elementoMensagem) {
        elementoMensagem.innerHTML = mensagem + elementoMensagem.innerHTML;
    }
}

/*************************************************************/
/*                        MODALS                             */
/*************************************************************/

/**
 * Exibe modal se houver mensagens de flash no HTML (classe .flashes).
 */
function showModal() {
    var modal = document.getElementById('myModal');
    var flashes = document.querySelector('.flashes');
    if (flashes && flashes.children.length > 0) {
        modal.classList.add('show');
        setTimeout(function () {
            closeModal(modal.getAttribute("id"));
        }, 3000);
        window.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeModal(modal.getAttribute("id"));
            }
        });
    }
}

/**
 * Fecha modal aplicando efeito de fade-out.
 */
function closeModal(modal_id) {
    var modal = document.getElementById(modal_id);
    modal.classList.add('fade-out');
    setTimeout(function () {
        modal.classList.remove('show', 'fade-out');
    }, 200);
}

/**
 * Exibe mensagem flash em um modal específico (jsModal), e fecha após 3s.
 */
function showFlashMessage(mensagem, tipo) {
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
        closeModal(modal.getAttribute("id"));
    }, 3000);
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal(modal.getAttribute("id"));
        }
    });
}

/*************************************************************/
/*                       PERMISSÕES                          */
/*************************************************************/

/**
 * Ajusta UI de links específicos se o usuário for administrador.
 */
function adminLoader() {
    var userContainer = document.getElementById('username-link')
    if (typeof isAdmin !== 'undefined' && isAdmin) {
        if (isAdmin === true) {
            userContainer.setAttribute('href', "/admin")
        }
    }
}

/*************************************************************/
/*                        UTILIDADES                         */
/*************************************************************/

/**
 * Verifica disponibilidade do servidor através da rota /ping.
 */
function checkServerAvailability() {
    return fetch('/ping')
        .then(response => response.ok ? true : false)
        .catch(() => false);
}

/**
 * Converte um objeto FormData para um objeto JS simples (key-value).
 */
function formDataToObject(formData) {
    var formDataObject = {};
    formData.forEach(function(value, key){
        formDataObject[key] = value;
    });
    return formDataObject;
}

/**
 * Exibe caixa de diálogo de confirmação para limpeza de formulário.
 */
function confirmFormReset(form) {
    var confirmar = confirm("Tem certeza que deseja limpar tudo?");
    if (confirmar) {
        formReset(form);
    }
}

/**
 * Reseta o formulário e atualiza a data para o dia atual.
 */
function formReset(form) {
    var formulario = document.getElementById(form);
    formulario.reset();
    updateDate();
}

/**
 * funcao generica que formata apenas com letras
 */
function setupOnlyLetters(idElement) {
    element = document.getElementById(idElement);
    element.value = element.value.toUpperCase().replace(/[0-9]/g, '');
}
