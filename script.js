document.addEventListener("DOMContentLoaded", function () {
    const eixoSelect = document.getElementById("eixo");
    const segmentoSelect = document.getElementById("segmento");
    const formatoSelect = document.getElementById("formato");
    const autorInput = document.getElementById("autor");
    const palavrasChaveInput = document.getElementById("palavrasChave");
    const resultsContainer = document.getElementById("results");
    const quantidadeResultados = document.getElementById("quantidadeResultados");

    // Novas variáveis para controle de paginação e visualização
    let currentPage = 1;
    let itemsPerPage = 15;
    let currentView = 'cards';

    let filteredResults = [];

    let segmentos = [];
    let acervo = [];

    // Carregar os JSONs
    function loadJSON() {
        return Promise.all([
            $.getJSON('segmentos.json'),
            $.getJSON('acervo.json')
        ]).then(([segmentosData, acervoData]) => {
            segmentos = segmentosData.filter(item => item.Perfil === "Aluno");
            acervo = acervoData;
            populateEixoOptions();
            populateFormatoOptions();
            initializeDisplay();
            filterResults();
        }).catch(error => {
            console.error("Erro ao carregar os arquivos JSON: ", error);
        });
    }


    // function initializeDisplay() {
    //     resultsContainer.className = 'card-container';
    //     filteredResults = acervo; // Inicialmente mostra todos os resultados
    //     displayResults(filteredResults);
    // }

    // Função para alternar visualização
    function toggleView(view) {
        currentView = view;
        currentPage = 1;
        itemsPerPage = view === 'cards' ? 15 : 30;
        resultsContainer.className = `${view}-container`;
        displayResults(filteredResults);
    }

    // Popular opções de Eixo Tecnológico
    function populateEixoOptions() {
        const eixos = [...new Set(segmentos.map(item => item["Eixo Tecnológico"]))];
        populateSelect(eixoSelect, eixos);
    }

     // Função helper para processar segmentos
     function processSegmentos(segmentosString) {
        return segmentosString.split(";")
            .map(seg => seg.trim())
            .filter(seg => seg && !seg.toLowerCase().startsWith("falso"));
    }


    function populateSelect(selectElement, options) {
        const currentValue = selectElement.value;
        selectElement.innerHTML = '<option value="">Selecione...</option>';
        options.forEach(option => {
            if (option.trim() !== "") {
                const optionElement = document.createElement("option");
                optionElement.value = option;
                optionElement.textContent = option;
                selectElement.appendChild(optionElement);
            }
        });
        selectElement.value = currentValue;
    }

    // Atualizar Segmentos com base no Eixo Tecnológico
    eixoSelect.addEventListener("change", function () {
        const eixoSelecionado = eixoSelect.value;
        let segmentosUnicos = [];
        
        if (eixoSelecionado) {
            // Filtrar os itens do segmento.json que correspondem ao eixo selecionado
            const segmentosFiltrados = segmentos.filter(item => 
                item["Eixo Tecnológico"] === eixoSelecionado
            );
            
            // Extrair e processar todos os segmentos únicos dos itens filtrados
            segmentosUnicos = [...new Set(segmentosFiltrados.flatMap(item => 
                processSegmentos(item.Segmentos)
            ))];
        } else {
            // Se nenhum eixo estiver selecionado, mostrar todos os segmentos válidos
            segmentosUnicos = [...new Set(segmentos.flatMap(item => 
                processSegmentos(item.Segmentos)
            ))];
        }
        
        populateSelect(segmentoSelect, segmentosUnicos);
        filterResults();
    });

    // Popular opções de Formato
    function populateFormatoOptions() {
        const formatos = [...new Set(acervo.map(curso => curso.Formato))];
        populateSelect(formatoSelect, formatos);
    }

    

    // Função para criar controles de visualização
    function createViewControls() {
        const viewControls = document.createElement('div');
        viewControls.className = 'view-controls';
        viewControls.innerHTML = `
          `;
        return viewControls;
    }

    // Função para criar controles de paginação
    function createPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination';
        
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo; Anterior';
        prevButton.className = 'pagination-button';
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                displayResults(filteredResults);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        
        const nextButton = document.createElement('button');
        nextButton.innerHTML = 'Próximo &raquo;';
        nextButton.className = 'pagination-button';
        nextButton.disabled = currentPage === totalPages;
        nextButton.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayResults(filteredResults);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        
        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        
        paginationContainer.appendChild(prevButton);
        paginationContainer.appendChild(pageInfo);
        paginationContainer.appendChild(nextButton);
        
        return paginationContainer;
    }



    // Função para filtrar e exibir os resultados
    function filterResults() {
        const eixoSelecionado = eixoSelect.value;
        const segmentoSelecionado = segmentoSelect.value;
        const formato = formatoSelect.value;
        const autor = autorInput.value.toLowerCase();
        const palavrasChave = palavrasChaveInput.value.toLowerCase();

        let segmentosDoEixo = [];
        if (eixoSelecionado) {
            // Obter todos os segmentos válidos do eixo selecionado
            segmentosDoEixo = segmentos
                .filter(item => item["Eixo Tecnológico"] === eixoSelecionado)
                .flatMap(item => processSegmentos(item.Segmentos));
        }

        const cursosFiltrados = acervo.filter(curso => {
            // Separar os segmentos do curso
            const segmentosCurso = processSegmentos(curso.Segmentos);

            // Verificar se o curso corresponde ao eixo selecionado
            const matchEixo = !eixoSelecionado || 
                segmentosCurso.some(seg => segmentosDoEixo.includes(seg));

            // Verificar se o curso corresponde ao segmento selecionado
            const matchSegmento = !segmentoSelecionado || 
                segmentosCurso.includes(segmentoSelecionado);
            
            //manter
            const matchFormato = !formato || curso.Formato === formato;
            const matchAutor = !autor || curso.Autor.toLowerCase().includes(autor);
            
            const matchKeywords = !palavrasChave || 
                [curso.ISBN, curso.Segmentos, curso["Título do conteúdo"], curso["Sub-título"], curso["Curso; Compêtencias e Assuntos"]]
                    .some(field => field && field.toLowerCase().includes(palavrasChave));

            return matchEixo && matchSegmento && matchFormato && matchAutor && matchKeywords;
        });

        filteredResults = cursosFiltrados;
        currentPage = 1; // Reset para primeira página ao filtrar
        displayResults(cursosFiltrados);
    }

    // Exibir os resultados filtrados
    function displayResults(cursos) {
        resultsContainer.innerHTML = "";
        quantidadeResultados.textContent = `${cursos.length} Conteúdos encontrados`;

        if (cursos.length === 0) {
            resultsContainer.innerHTML = "<p>Nenhum conteúdo encontrado.</p>";
            return;
        }

        // Adicionar controles de visualização
        const viewControls = createViewControls();
        resultsContainer.appendChild(viewControls);

        // Calcular itens para a página atual
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = cursos.slice(startIndex, endIndex);

        // Container para os itens
        const itemsContainer = document.createElement('div');
        itemsContainer.className = `card-container`;

        paginatedItems.forEach(curso => {
            const item = document.createElement("div");
            item.className = 'card';

            if (currentView === 'cards') {
                item.innerHTML = `
               <h2 class="card-title">${curso["Título do conteúdo"]}</h2>
    <div class="card-content">
        <img src="${curso["CAPA 1"]}" alt="Capa do conteúdo" class="card-image">
        <div class="card-texts">
            <p><strong>Autor:</strong> ${curso.Autor}</p>
            <p><strong>Segmento:</strong> ${curso.Segmentos}</p>
            <p><strong>Formato:</strong> ${curso.Formato} ${getFormatoIcon(curso.Formato)}</p>
            <p><strong>ISBN:</strong> ${curso.ISBN}</p>
        </div>
    </div>
    <div class="card-button">
        <a href="${curso.URL}" target="_blank" style="text-decoration: none">
            <button class="access-button">
                <span id="span-button">Clique aqui para acessar o conteúdo</span>
            </button>
        </a>
    </div>
        `;
            
            }

            itemsContainer.appendChild(item);
        });

        resultsContainer.appendChild(itemsContainer);

        // Adicionar paginação se houver mais de uma página
        if (cursos.length > itemsPerPage) {
            const paginationControls = createPagination(cursos.length);
            resultsContainer.appendChild(paginationControls);
        }
    }

    function getFormatoIcon(formato) {
        if (formato.toLowerCase() === "mp4") {
            return '<i class="fa-solid fa-video" style="color: #000000;"></i>';
        } else if (formato.toLowerCase() === "mp3") {
            return '<i class="fa-solid fa-headphones" style="color: #000000;"></i>';
        } else {
            return '<i class="fa-solid fa-book" style="color: #000000;"></i>';
        }
    }

    // Inicialização
    loadJSON();

    // Implementar busca dinâmica
    [eixoSelect, segmentoSelect, formatoSelect, autorInput, palavrasChaveInput].forEach(element => {
        element.addEventListener("input", filterResults);
        element.addEventListener("change", filterResults);
    });

    // Expor função toggleView globalmente
    window.toggleView = toggleView;
});