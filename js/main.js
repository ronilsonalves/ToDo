import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, get } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";
const auth = getAuth();
let usuario;

window.onload = startApp;

// Inicia a aplicalção
function startApp() {
    verificaAutenticacao();
    renderLoadAnimation();
    setTheme();
    setDatas();
    /* renderTaskCards(); */ // as task são renderizadas ao chamar a verificação de autenticação.
}

// Define as regras para as datas
function setDatas() {
    const dataInicial = document.getElementById('data-inicial');
    const data = new Date().toLocaleString('pt-br', { timeZone: 'America/Sao_Paulo' }).split(' ')[0].split('/')
    let dataFormatada = data.reverse().join('-')
    dataInicial.value = dataFormatada;
    dataInicial.disabled = true;

    const dataFinal = document.getElementById('data-final');
    dataFinal.min = dataFormatada;

    //Preenchimento automático da data final para hoje
    dataFinal.value = dataFormatada;
}

// Validação do campo descrição
function validaDescricao() {
    const text = document.getElementById("descricao").value
    if (text == null || text == undefined || text.length < 10)
        return false;
    else
        return true;
}

// Validação do campo data final
function validaDataFinal() {
    let data = new Date().toLocaleString('pt-br', {timeZone: 'America/Sao_Paulo'}).split(' ')[0].split('/')
    data = data.reverse();
    const dtfinal = document.getElementById('data-final').value.split('-')
    if(dtfinal == undefined || dtfinal == null){
        return false
    }
    
    if(dtfinal[0] > data[0]){
        return true;
    } else if(dtfinal[0] >= data[0] && dtfinal[1] > data[1]){
        return true;
    } else if(dtfinal[0] >= data[0] && dtfinal[1] >= data[1] && dtfinal[2] >= data[2]){
        return true;
    }

    return false;
}

// Funcao pra verificar se o usuário está logado -OK
function verificaAutenticacao() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            usuario = user; // salvo pra fazer a escrita na função saveTask().
            localStorage.setItem("userId", user.uid); // salvamos a ID do usuário autenticado no local storage pra renderizarmos suas tarefas
            localStorage.setItem("userName", user.displayName); //Exibir o nome do usuário na página
            renderTaskCards(); // Isso corrigiu o bug de não mostrar os cards no carregamento inicial da página
        } else {
            alert("Você saiu da sua conta ou não está logado, estamos te redirecionando para página de login...");
            window.location.pathname = "/ToDo/";
        }
    })
}


// Salvar a tarefa no banco -OK
function saveTask() {
    const dataInicio = document.getElementById("data-inicial").value;
    const dataFinal = document.getElementById("data-final").value;
    const descricao = document.getElementById("descricao").value;
    // Salvamos o ID do usuário, para atrelar ele às suas tarefas
    const uid = usuario.uid;
    // Criamos a tarefa e salvamos com o ID do usuário atrelada a ela, na consulta ele só poderá visualizar suas próprias tarefas.
    const database = getDatabase();
    const listaDeTarefas = ref(database, uid);
    const novaTarefa = push(listaDeTarefas);
    set(novaTarefa, {
        dataInicio: dataInicio,
        dataFinal: dataFinal,
        descricao: descricao,
        checked: false
    }).then(() => {
        alert("Nova tarefa criada com sucesso!");
    }).catch((error) => {
        console.log(error);
        alert("Não foi possível cadastrar sua tarefa, tente novamente em breve. ERRO:", error);
    });
}

// Apaga todas as tarefas -OK
function clearTasks() {
    const uid = localStorage.getItem("userId");
    const database = getDatabase();
    const referencia = ref(database, uid);
    set(referencia, null).then(() => {
        alert("Todas as tarefas foram apagadas!");
    }).catch(error => {
        alert("Desculpe, ocorreu um erro ao apagar todas as tarefas.");
        console.log(error);
    })
}

//Apagar tarefa -OK
function deleteTask(tarefa) {
    const database = getDatabase();
    const uid = localStorage.getItem("userId");
    const taskToRemove = ref(database, uid + '/' + tarefa);
    set(taskToRemove, null)
        .then(() => console.log("Removeu!"))
        .catch(error => console.log("Aconteceu um erro", error));
}

// Renderiza os cards com as tarefas
async function renderTaskCards() {
    const cardsCountainer = document.getElementById("card-container");
    const uid = localStorage.getItem("userId");
    const database = getDatabase();
    const listaDeTarefas = ref(database, uid);

    onValue(listaDeTarefas, (snapshot) => {
        let tasks = [];
        snapshot.forEach(function (valores) {
            var tarefa = valores.val();
            tarefa.key = valores.key;
            tasks.unshift(tarefa);
        })

        if (tasks == null || tasks == undefined || tasks == '' || tasks.length == 0) {
            cardsCountainer.innerHTML = "";
            const warning = document.createElement("p");
            warning.innerHTML = "Ainda não há tarefas";
            cardsCountainer.appendChild(warning);
        } else {
            cardsCountainer.innerHTML = ""

            const clearButton = document.createElement("button");
            clearButton.innerHTML = "LIMPAR TAREFAS";
            clearButton.id = 'clear-button';

            cardsCountainer.appendChild(clearButton);

            tasks.forEach(task => {
                // Card de tarefas
                const taskCard = document.createElement("div");
                taskCard.classList = "task-card tipografy";
                taskCard.id = task.key;
                cardsCountainer.appendChild(taskCard);

                const checkbox = document.createElement('input');
                checkbox.type = "checkbox";
                checkbox.checked = task.checked;


                const descricao = document.createElement("p");
                descricao.classList = "task-description";
                descricao.innerHTML = task.descricao;
                if(checkbox.checked){
                    descricao.style.textDecoration = "line-through";
                    descricao.style.opacity = .5;
                }

                const dataInicial = document.createElement("div");
                dataInicial.id = "dataInicial";
                dataInicial.innerHTML = `Data inicial: ${task.dataInicio}`;
                dataInicial.classList = "data tipografy";
                const dataFinal = document.createElement("div");
                dataFinal.id = "dataFinal";
                dataFinal.innerHTML = `Termino: ${task.dataFinal}`;
                dataFinal.classList = "data tipografy";

                const datasCountainer = document.createElement("div");
                datasCountainer.classList = "datas-countainer tipografy"
                datasCountainer.appendChild(dataInicial);
                datasCountainer.appendChild(dataFinal);

                const contentCuntttaner = document.createElement("div");
                contentCuntttaner.classList = "content-task tipografy";
                contentCuntttaner.appendChild(descricao);
                contentCuntttaner.appendChild(datasCountainer);

                const lixeira = document.createElement('img');
                lixeira.classList = "lixeira";
                lixeira.src = "../assets/svg/lixeira.svg";

                taskCard.appendChild(checkbox);
                taskCard.appendChild(contentCuntttaner);
                taskCard.appendChild(lixeira);

            });

            // Remove uma tarefa ao clicar na lixeira -OK
            const taskCardsCountainer = document.getElementById("card-container");
            document.querySelectorAll(".lixeira").forEach(lixeira => {
                lixeira.onclick = () => {
                    const task = lixeira.parentNode;
                    if (confirm("Você deseja realmente apagar essa tarefa? Essa ação não pode ser desfeita. Clique em OK para confirmar.")){
                        deleteTask(task.id);
                    }
                }
            })

            // Remove todas as tarefas do usuário ao clicar no botão "Limpar Tarefas" -OK
            const botaoLimpar = document.getElementById("clear-button");
            botaoLimpar.addEventListener('click', e => {
                e.preventDefault();
                if (confirm("Você tem certeza que deseja excluir todas as tarefas? Essa ação não poderá ser desfeita. Clique em OK para confirmar.")){
                    clearTasks();
                }
            })

            //Chamar a função pra atualizar o status da tarefa aqui. -OK
            const chekList = document.querySelectorAll('input[type = "checkbox"]');
            chekList.forEach(checkbox => {
                checkbox.onclick = () => {
                    const database = getDatabase();
                    let task = checkbox.parentNode;

                    const uid = localStorage.getItem("userId");
                    const taskToUpdate = ref(database, uid + '/' + task.id);
                    let valores = [];

                    //Get - Pega os valores da tarefa no banco
                    get(taskToUpdate).then(snapshot => {
                        valores.push(snapshot.val());
                        //Realiza o update do status no banco usando a função set
                        if (valores[0].checked) {
                            set(taskToUpdate, {
                                dataInicio: valores[0].dataInicio,
                                dataFinal: valores[0].dataFinal,
                                descricao: valores[0].descricao,
                                checked: false
                            }).then(() => {
                                console.log("Atualizou!");
                            }).catch(error => console.log("Aconteceu um erro", error));
                        } else {
                            set(taskToUpdate, {
                                dataInicio: valores[0].dataInicio,
                                dataFinal: valores[0].dataFinal,
                                descricao: valores[0].descricao,
                                checked: true
                            }).then(() => {
                                console.log("Atualizou!");
                            }).catch(error => console.log("Aconteceu um erro", error))
                        }
                    }).catch(error => console.log("Um erro aconteceu ao ler/gravar os dados. Erro:", error));
                }
            })
        }
    })
}

const themeButton = document.getElementById("theme-button");
themeButton.onclick = () => {
    if (window.sessionStorage.getItem('theme') == 'dark') {
        window.sessionStorage.setItem('theme', 'light')
    } else if (window.sessionStorage.getItem('theme') == 'light') {
        window.sessionStorage.setItem('theme', 'dark')
    }

    setTheme();
}

const paragrafoNomeUsuario = document.getElementById("nome-usuario");
let welcomeUser = localStorage.getItem("userName");
if (localStorage.getItem("userName") === null || localStorage.getItem("userName") === undefined){
    welcomeUser = "Olá!";
} else {
    welcomeUser = "Olá, "+localStorage.getItem("userName")+"!";
}
paragrafoNomeUsuario.append(document.createTextNode(welcomeUser));

const exitLink = document.getElementById("exit");
exitLink.onclick = () => {
    signOut(auth).then(() => {
        window.location.href = "/ToDo/";
      }).catch((error) => {
        alert("Xiii, não foi possível sair da conta. Tente novamente.")
      });
};

const inputDataFinal = document.getElementById('data-final');
inputDataFinal.addEventListener('keypress', e => inputDataFinal.style.border = "1px solid #73b3f");

const inputDescricao = document.getElementById("descricao");
inputDescricao.addEventListener('keypress', e => inputDescricao.style.border = "1px solid #73b3f");

const botaoSalvar = document.getElementById("submit-button");
botaoSalvar.addEventListener('click', e => {
    e.preventDefault();
    const dtfinal = document.getElementById('data-final')
    const descricao = document.getElementById("descricao")

    if (!validaDataFinal()) {
        dtfinal.style.border = "2px solid red"
        alert("A data deve ser maior ou igual a hoje!")
    } else if (!validaDescricao()) {
        alert("A descrição deve ser deve conter mais de 10 caracters!")
        descricao.style.border = "2px solid red"
    } else {
        saveTask();
    }
})