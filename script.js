// Variables globales
let board = [];
let currentScore = 0;
let highScore = 0;
const size = 4;

// Elementos del DOM
let currentScoreElem;
let highScoreElem;
let gameOverElem;

// Función para cambiar entre temas
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Actualizar el atributo data-theme en el body
    body.setAttribute('data-theme', newTheme);
    
    // Guardar la preferencia
    localStorage.setItem('theme', newTheme);
    
    // Actualizar el ícono
    updateThemeIcon();
}

// Función para actualizar el ícono del tema
function updateThemeIcon() {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Claro';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Oscuro';
    }
}

// Cargar tema guardado
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

// Inicializar el juego
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar elementos del DOM
    currentScoreElem = document.getElementById('score');
    highScoreElem = document.getElementById('high-score');
    gameOverElem = document.getElementById('game-over');
    const grid = document.getElementById('grid');
    
    // Cargar tema guardado al iniciar
    loadTheme();
    
    // Configurar el botón de cambio de tema
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.type = 'button';
    themeToggle.addEventListener('click', toggleTheme);
    
    // Crear el tablero
    grid.innerHTML = ''; // Limpiar el tablero
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.setAttribute('data-row', i);
            cell.setAttribute('data-col', j);
            grid.appendChild(cell);
        }
    }
    
    // Cargar puntuación más alta guardada
    highScore = parseInt(localStorage.getItem('2048-highScore')) || 0;
    highScoreElem.textContent = highScore;


    function updateScore(value) {
        currentScore += value;
        currentScoreElem.textContent = currentScore;
        if (currentScore > highScore) {
            highScore = currentScore;
            highScoreElem.textContent = highScore;
            localStorage.setItem('2048-highScore', highScore);
        }
    }

    function restartGame() {
        // Reiniciar el tablero
        board = [...Array(size)].map(e => Array(size).fill(0));
        
        // Reiniciar puntuación
        currentScore = 0;
        currentScoreElem.textContent = '0';
        
        // Ocultar mensaje de juego terminado
        gameOverElem.style.display = 'none';
        
        // Inicializar juego con dos fichas aleatorias
        placeRandom();
        placeRandom();
        renderBoard();
    }
    
    // Inicializar el juego por primera vez
    restartGame();

    function renderBoard() {
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                let cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                if (!cell) continue;
                
                const prevValue = cell.dataset.value;
                const currentValue = board[i][j];
                
                // Reset de clases y contenido
                cell.className = 'cell';
                cell.innerHTML = ''; // Limpiar contenido anterior
                
                if (currentValue !== 0) {
                    cell.dataset.value = currentValue;
                    const valueSpan = document.createElement('span');
                    valueSpan.textContent = currentValue;
                    cell.appendChild(valueSpan);
                    
                    // Aplicar clase de estilo basada en el valor
                    const valueClass = `tile-${currentValue}`;
                    cell.classList.add(valueClass);
                    
                    // Manejo de animaciones
                    if (currentValue !== parseInt(prevValue || 0)) {
                        cell.classList.add('new-tile');
                    }
                } else {
                    delete cell.dataset.value;
                }
            }
        }
        
        // Actualizar la puntuación en el modal de juego terminado
        document.getElementById('final-score').textContent = currentScore;
        
        // Remover clases de animación después de la transición
        setTimeout(() => {
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                cell.classList.remove('merged-tile', 'new-tile');
            });
        }, 200);
    }

    // Función para colocar una ficha aleatoria en el tablero
    function placeRandom() {
        const available = [];
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] === 0) {
                    available.push({ x: i, y: j });
                }
            }
        }

        if (available.length > 0) {
            const randomCell = available[Math.floor(Math.random() * available.length)];
            board[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
            const cell = document.querySelector(`[data-row="${randomCell.x}"][data-col="${randomCell.y}"]`);
            cell.classList.add('new-tile'); // Animación para nuevas fichas
        }
    }

    function move(direction) {
        let hasChanged = false;
        if (direction === 'ArrowUp' || direction === 'ArrowDown') {
            for (let j = 0; j < size; j++) {
                const column = [...Array(size)].map((_, i) => board[i][j]);
                const newColumn = transform(column, direction === 'ArrowUp');
                for (let i = 0; i < size; i++) {
                    if (board[i][j] !== newColumn[i]) {
                        hasChanged = true;
                        board[i][j] = newColumn[i];
                    }
                }
            }
        } else if (direction === 'ArrowLeft' || direction === 'ArrowRight') {
            for (let i = 0; i < size; i++) {
                const row = board[i];
                const newRow = transform(row, direction === 'ArrowLeft');
                if (row.join(',') !== newRow.join(',')) {
                    hasChanged = true;
                    board[i] = newRow;
                }
            }
        }
        if (hasChanged) {
            placeRandom();
            renderBoard();
            checkGameOver();
        }
    }

    function transform(line, moveTowardsStart) {
        // Filtrar celdas vacías
        let newLine = line.filter(cell => cell !== 0);
        
        // Invertir el array si el movimiento es hacia la derecha o abajo
        if (!moveTowardsStart) {
            newLine.reverse();
        }
        
        // Combinar fichas iguales
        for (let i = 0; i < newLine.length - 1; i++) {
            if (newLine[i] === newLine[i + 1]) {
                newLine[i] *= 2;
                updateScore(newLine[i]); // Actualizar puntuación al combinar fichas
                newLine.splice(i + 1, 1);
            }
        }
        
        // Rellenar con ceros hasta completar el tamaño
        while (newLine.length < size) {
            newLine.push(0);
        }
        
        // Volver a invertir si era movimiento hacia la derecha o abajo
        if (!moveTowardsStart) {
            newLine.reverse();
        }
        
        return newLine;
    }

    function checkGameOver() {
        // Verificar si hay celdas vacías o movimientos posibles
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                // Si hay al menos una celda vacía, el juego no ha terminado
                if (board[i][j] === 0) {
                    return;
                }
                // Verificar si hay celdas adyacentes iguales horizontalmente
                if (j < size - 1 && board[i][j] === board[i][j + 1]) {
                    return; // Hay movimientos posibles horizontalmente
                }
                // Verificar si hay celdas adyacentes iguales verticalmente
                if (i < size - 1 && board[i][j] === board[i + 1][j]) {
                    return; // Hay movimientos posibles verticalmente
                }
            }
        }

        // Si llegamos aquí, no hay movimientos posibles - juego terminado
        gameOverElem.style.display = 'flex';
    }

    // Función para manejar el movimiento con teclado
    function handleKeyDown(event) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            move(event.key);
        }
    }
    
    // Función para manejar el reinicio del juego
    function handleRestart() {
        gameOverElem.style.display = 'none';
        restartGame();
    }
    
    // Configurar manejadores de eventos
    function setupEventListeners() {
        // Teclado
        document.removeEventListener('keydown', handleKeyDown);
        document.addEventListener('keydown', handleKeyDown);
        
        // Botones de reinicio
        const restartBtn = document.getElementById('restart-btn');
        const restartGameOverBtn = document.getElementById('restart-btn-gameover');
        
        restartBtn.removeEventListener('click', handleRestart);
        restartGameOverBtn.removeEventListener('click', handleRestart);
        
        restartBtn.addEventListener('click', handleRestart);
        restartGameOverBtn.addEventListener('click', handleRestart);
        
        // Asegurarse de que el body pueda recibir eventos de teclado
        document.body.setAttribute('tabindex', '0');
        document.body.focus();
    }
    
    // Inicializar el juego
    setupEventListeners();
    
    // Enfocar el body al hacer clic en cualquier parte de la página
    document.addEventListener('click', () => {
        document.body.focus();
    });

});