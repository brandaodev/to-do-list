/*
 * =====================================
 * TODO LIST FIREBASE - LÓGICA PRINCIPAL
 * =====================================
 * 
 * Aplicação completa de Todo List integrada ao Firebase Firestore
 * 
 * FUNCIONALIDADES PRINCIPAIS:
 * - Integração completa com Firebase Firestore v12.3.0
 * - CRUD de categorias com sincronização em tempo real
 * - CRUD de tarefas com relacionamento às categorias
 * - Filtros dinâmicos (todas, pendentes, concluídas)
 * - Estatísticas em tempo real
 * - Interface responsiva com tema escuro
 * - Modais para adicionar/editar categorias e tarefas
 * - Confirmação de exclusão
 * - Indicadores de prioridade e status
 * 
 * REGRAS FIRESTORE RECOMENDADAS:
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /categories/{document} {
 *       allow read, write: if true;
 *     }
 *     match /tasks/{document} {
 *       allow read, write: if true;
 *     }
 *   }
 * }
 * 
 * COLEÇÕES FIRESTORE:
 * - categories: {id, name, icon, color, createdAt}
 * - tasks: {id, title, description, categoryId, priority, dueDate, completed, createdAt, updatedAt}
 * 
 * Autor: Sistema Todo List Firebase
 * Data: 2025
 */

// =====================================
// IMPORTAÇÕES FIREBASE CDN v12.3.0
// =====================================

// Importação do Firebase App (Core)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

// Importação das funções do Firestore
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    where,
    serverTimestamp,
    enableNetwork,
    disableNetwork
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// =====================================
// CONFIGURAÇÃO FIREBASE
// =====================================

// Configuração Firebase fornecida pelo usuário
const firebaseConfig = {
    apiKey: "AIzaSyBGYD8QDpa5cLCUFoAF4SSHFFOywdElamk",
    authDomain: "todo-lojapronta.firebaseapp.com",
    projectId: "todo-lojapronta",
    storageBucket: "todo-lojapronta.firebasestorage.app",
    messagingSenderId: "922858854551",
    appId: "1:922858854551:web:140d02455a461e7425f1d2"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);

// Inicialização do Firestore
const db = getFirestore(app);

// =====================================
// VARIÁVEIS GLOBAIS DA APLICAÇÃO
// =====================================

// Estado da aplicação
let categories = [];
let tasks = [];
let currentFilter = 'all';
let selectedCategoryId = null;
let isEditingCategory = false;
let isEditingTask = false;
let editingCategoryId = null;
let editingTaskId = null;

// Referências dos elementos DOM
let elements = {};

// Listeners do Firestore para cleanup
let categoriesListener = null;
let tasksListener = null;

// =====================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =====================================

/**
 * Função principal de inicialização
 * Configura event listeners e carrega dados do Firestore
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando aplicação Todo List Firebase...');
    
    try {
        // Inicializar referências DOM
        initializeElements();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Mostrar loading
        showLoading('Conectando ao Firebase...');
        
        // Verificar conexão Firebase
        await testFirebaseConnection();
        
        // Inicializar listeners em tempo real
        initializeFirestoreListeners();
        
        // Criar categorias padrão se não existirem
        await createDefaultCategories();
        
        // Esconder loading
        hideLoading();
        
        console.log('✅ Aplicação inicializada com sucesso!');
        showFirebaseStatus('Conectado ao Firebase', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar aplicação:', error);
        hideLoading();
        showFirebaseStatus('Erro de conexão', 'error');
    }
});

/**
 * Inicializa todas as referências dos elementos DOM
 */
function initializeElements() {
    elements = {
        // Containers principais
        categoriesContainer: document.getElementById('categoriesContainer'),
        tasksContainer: document.getElementById('tasksContainer'),
        
        // Estatísticas
        totalTasks: document.getElementById('totalTasks'),
        completedTasks: document.getElementById('completedTasks'),
        pendingTasks: document.getElementById('pendingTasks'),
        
        // Título da categoria atual
        categoryTitle: document.getElementById('categoryTitle'),
        
        // Estados vazios
        emptyState: document.getElementById('emptyState'),
        
        // Botões principais
        addCategoryBtn: document.getElementById('addCategoryBtn'),
        addTaskBtn: document.getElementById('addTaskBtn'),
        
        // Filtros
        filterBtns: document.querySelectorAll('.filter-btn'),
        
        // Modal de categoria
        categoryModal: document.getElementById('categoryModal'),
        categoryModalTitle: document.getElementById('categoryModalTitle'),
        categoryForm: document.getElementById('categoryForm'),
        categoryName: document.getElementById('categoryName'),
        categoryIcon: document.getElementById('categoryIcon'),
        saveCategoryBtn: document.getElementById('saveCategoryBtn'),
        cancelCategoryBtn: document.getElementById('cancelCategoryBtn'),
        closeCategoryModal: document.getElementById('closeCategoryModal'),
        
        // Modal de tarefa
        taskModal: document.getElementById('taskModal'),
        taskModalTitle: document.getElementById('taskModalTitle'),
        taskForm: document.getElementById('taskForm'),
        taskTitle: document.getElementById('taskTitle'),
        taskDescription: document.getElementById('taskDescription'),
        taskCategory: document.getElementById('taskCategory'),
        taskPriority: document.getElementById('taskPriority'),
        taskDueDate: document.getElementById('taskDueDate'),
        saveTaskBtn: document.getElementById('saveTaskBtn'),
        cancelTaskBtn: document.getElementById('cancelTaskBtn'),
        closeTaskModal: document.getElementById('closeTaskModal'),
        
        // Modal de confirmação
        confirmModal: document.getElementById('confirmModal'),
        confirmMessage: document.getElementById('confirmMessage'),
        confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
        cancelConfirmBtn: document.getElementById('cancelConfirmBtn'),
        closeConfirmModal: document.getElementById('closeConfirmModal'),
        
        // Loading overlay
        loadingOverlay: document.getElementById('loadingOverlay')
    };
}

/**
 * Configura todos os event listeners da aplicação
 */
function setupEventListeners() {
    // Botões principais
    elements.addCategoryBtn.addEventListener('click', () => openCategoryModal());
    elements.addTaskBtn.addEventListener('click', () => openTaskModal());
    
    // Filtros de tarefas
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.closest('.filter-btn').dataset.filter;
            setActiveFilter(filter);
        });
    });
    
    // Modal de categoria - CORRIGIDO: Botão salvar agora funciona
    elements.saveCategoryBtn.addEventListener('click', handleCategorySubmit);
    elements.cancelCategoryBtn.addEventListener('click', closeCategoryModal);
    elements.closeCategoryModal.addEventListener('click', closeCategoryModal);
    
    // Modal de tarefa - CORRIGIDO: Botão salvar agora funciona
    elements.saveTaskBtn.addEventListener('click', handleTaskSubmit);
    elements.cancelTaskBtn.addEventListener('click', closeTaskModal);
    elements.closeTaskModal.addEventListener('click', closeTaskModal);
    
    // Modal de confirmação
    elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
    elements.cancelConfirmBtn.addEventListener('click', closeConfirmModal);
    elements.closeConfirmModal.addEventListener('click', closeConfirmModal);
    
    // Fechar modais clicando no overlay
    [elements.categoryModal, elements.taskModal, elements.confirmModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-overlay')) {
                closeAllModals();
            }
        });
    });
    
    // Tecla ESC para fechar modais
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// =====================================
// FUNÇÕES FIREBASE FIRESTORE
// =====================================

/**
 * Testa a conexão com o Firebase
 */
async function testFirebaseConnection() {
    try {
        await getDocs(collection(db, 'categories'));
        console.log('🔥 Conexão Firebase establishment com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro de conexão Firebase:', error);
        throw error;
    }
}

/**
 * Inicializa os listeners em tempo real do Firestore
 */
function initializeFirestoreListeners() {
    // Listener para categorias
    const categoriesQuery = query(
        collection(db, 'categories'), 
        orderBy('createdAt', 'asc')
    );
    
    categoriesListener = onSnapshot(categoriesQuery, (snapshot) => {
        categories = [];
        snapshot.forEach((doc) => {
            categories.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('📂 Categorias atualizadas:', categories.length);
        renderCategories();
        updateCategorySelect();
    }, (error) => {
        console.error('❌ Erro ao escutar categorias:', error);
        showFirebaseStatus('Erro ao sincronizar categorias', 'error');
    });
    
    // Listener para tarefas
    const tasksQuery = query(
        collection(db, 'tasks'), 
        orderBy('createdAt', 'desc')
    );
    
    tasksListener = onSnapshot(tasksQuery, (snapshot) => {
        tasks = [];
        snapshot.forEach((doc) => {
            tasks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('📋 Tarefas atualizadas:', tasks.length);
        renderTasks();
        updateStatistics();
    }, (error) => {
        console.error('❌ Erro ao escutar tarefas:', error);
        showFirebaseStatus('Erro ao sincronizar tarefas', 'error');
    });
}

/**
 * Adiciona uma nova categoria ao Firestore
 */
async function addCategoryToFirebase(categoryData) {
    try {
        showLoading('Salvando categoria...');
        
        const docRef = await addDoc(collection(db, 'categories'), {
            ...categoryData,
            createdAt: serverTimestamp()
        });
        
        console.log('✅ Categoria adicionada:', docRef.id);
        showFirebaseStatus('Categoria salva com sucesso!', 'success');
        
        return docRef.id;
    } catch (error) {
        console.error('❌ Erro ao adicionar categoria:', error);
        showFirebaseStatus('Erro ao salvar categoria', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

/**
 * Atualiza uma categoria existente no Firestore
 */
async function updateCategoryInFirebase(categoryId, categoryData) {
    try {
        showLoading('Atualizando categoria...');
        
        const categoryRef = doc(db, 'categories', categoryId);
        await updateDoc(categoryRef, {
            ...categoryData,
            updatedAt: serverTimestamp()
        });
        
        console.log('✅ Categoria atualizada:', categoryId);
        showFirebaseStatus('Categoria atualizada com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar categoria:', error);
        showFirebaseStatus('Erro ao atualizar categoria', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

/**
 * Remove uma categoria do Firestore
 */
async function deleteCategoryFromFirebase(categoryId) {
    try {
        showLoading('Excluindo categoria...');
        
        // Primeiro, excluir todas as tarefas da categoria
        const tasksQuery = query(
            collection(db, 'tasks'),
            where('categoryId', '==', categoryId)
        );
        
        const tasksSnapshot = await getDocs(tasksQuery);
        const deletePromises = [];
        
        tasksSnapshot.forEach((taskDoc) => {
            deletePromises.push(deleteDoc(doc(db, 'tasks', taskDoc.id)));
        });
        
        await Promise.all(deletePromises);
        
        // Depois excluir a categoria
        await deleteDoc(doc(db, 'categories', categoryId));
        
        console.log('✅ Categoria e tarefas relacionadas excluídas:', categoryId);
        showFirebaseStatus('Categoria excluída com sucesso!', 'success');
        
        // Reset da categoria selecionada se foi a excluída
        if (selectedCategoryId === categoryId) {
            selectedCategoryId = null;
            elements.categoryTitle.textContent = 'Todas as Tarefas';
        }
        
    } catch (error) {
        console.error('❌ Erro ao excluir categoria:', error);
        showFirebaseStatus('Erro ao excluir categoria', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

/**
 * Adiciona uma nova tarefa ao Firestore
 */
async function addTaskToFirebase(taskData) {
    try {
        showLoading('Salvando tarefa...');
        
        const docRef = await addDoc(collection(db, 'tasks'), {
            ...taskData,
            completed: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        console.log('✅ Tarefa adicionada:', docRef.id);
        showFirebaseStatus('Tarefa salva com sucesso!', 'success');
        
        return docRef.id;
    } catch (error) {
        console.error('❌ Erro ao adicionar tarefa:', error);
        showFirebaseStatus('Erro ao salvar tarefa', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

/**
 * Atualiza uma tarefa existente no Firestore
 */
async function updateTaskInFirebase(taskId, taskData) {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
            ...taskData,
            updatedAt: serverTimestamp()
        });
        
        console.log('✅ Tarefa atualizada:', taskId);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar tarefa:', error);
        showFirebaseStatus('Erro ao atualizar tarefa', 'error');
        throw error;
    }
}

/**
 * Remove uma tarefa do Firestore
 */
async function deleteTaskFromFirebase(taskId) {
    try {
        await deleteDoc(doc(db, 'tasks', taskId));
        console.log('✅ Tarefa excluída:', taskId);
        showFirebaseStatus('Tarefa excluída com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao excluir tarefa:', error);
        showFirebaseStatus('Erro ao excluir tarefa', 'error');
        throw error;
    }
}

/**
 * Cria categorias padrão se não existirem
 */
async function createDefaultCategories() {
    try {
        // Verificar se já existem categorias
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        
        if (categoriesSnapshot.empty) {
            console.log('📂 Criando categorias padrão...');
            
            const defaultCategories = [
                { name: 'Trabalho', icon: 'fas fa-briefcase', color: 'var(--color-primary)' },
                { name: 'Casa', icon: 'fas fa-home', color: 'var(--color-success)' },
                { name: 'Estudos', icon: 'fas fa-graduation-cap', color: 'var(--color-warning)' },
                { name: 'Pessoal', icon: 'fas fa-heart', color: 'var(--color-error)' }
            ];
            
            const promises = defaultCategories.map(category => 
                addDoc(collection(db, 'categories'), {
                    ...category,
                    createdAt: serverTimestamp()
                })
            );
            
            await Promise.all(promises);
            console.log('✅ Categorias padrão criadas!');
        }
    } catch (error) {
        console.error('❌ Erro ao criar categorias padrão:', error);
    }
}

// =====================================
// FUNÇÕES DE RENDERIZAÇÃO
// =====================================

/**
 * Renderiza a lista de categorias
 */
function renderCategories() {
    if (!elements.categoriesContainer) return;
    
    elements.categoriesContainer.innerHTML = '';
    
    categories.forEach(category => {
        const categoryElement = createCategoryElement(category);
        elements.categoriesContainer.appendChild(categoryElement);
    });
}

/**
 * Cria elemento HTML para uma categoria
 */
function createCategoryElement(category) {
    const categoryCount = tasks.filter(task => task.categoryId === category.id).length;
    
    const categoryDiv = document.createElement('div');
    categoryDiv.className = `category-card ${selectedCategoryId === category.id ? 'active' : ''}`;
    categoryDiv.style.setProperty('--category-color', category.color);
    
    categoryDiv.innerHTML = `
        <div class="category-header">
            <div class="category-info">
                <div class="category-name">
                    <i class="${category.icon}"></i>
                    ${category.name}
                </div>
                <div class="category-count">${categoryCount} tarefa${categoryCount !== 1 ? 's' : ''}</div>
            </div>
            <div class="category-actions">
                <button class="category-action edit" onclick="editCategory('${category.id}')" title="Editar categoria">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="category-action delete" onclick="confirmDeleteCategory('${category.id}')" title="Excluir categoria">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    // Event listener para selecionar categoria
    categoryDiv.addEventListener('click', (e) => {
        if (!e.target.closest('.category-actions')) {
            selectCategory(category.id, category.name);
        }
    });
    
    return categoryDiv;
}

/**
 * Renderiza a lista de tarefas
 */
function renderTasks() {
    if (!elements.tasksContainer) return;
    
    const filteredTasks = getFilteredTasks();
    
    // Limpar container
    elements.tasksContainer.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        elements.tasksContainer.appendChild(elements.emptyState);
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        elements.tasksContainer.appendChild(taskElement);
    });
}

/**
 * Cria elemento HTML para uma tarefa
 */
function createTaskElement(task) {
    const category = categories.find(cat => cat.id === task.categoryId);
    const categoryName = category ? category.name : 'Sem categoria';
    
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
    
    // Formatação da data de vencimento
    let dueDateHtml = '';
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        const isOverdue = dueDate < today && !task.completed;
        const isToday = dueDate.getTime() === today.getTime();
        
        let dateClass = '';
        let dateText = dueDate.toLocaleDateString('pt-BR');
        
        if (isOverdue) {
            dateClass = 'overdue';
            dateText = `⚠️ ${dateText}`;
        } else if (isToday) {
            dateClass = 'today';
            dateText = `📅 Hoje`;
        }
        
        dueDateHtml = `<span class="task-due-date ${dateClass}"><i class="fas fa-calendar"></i> ${dateText}</span>`;
    }
    
    taskDiv.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
               onchange="toggleTaskComplete('${task.id}', this.checked)">
        
        <div class="task-content">
            <div class="task-title">${task.title}</div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-meta">
                <span><i class="fas fa-folder"></i> ${categoryName}</span>
                <span><i class="fas fa-flag"></i> ${getPriorityText(task.priority)}</span>
                ${dueDateHtml}
            </div>
        </div>
        
        <div class="task-actions">
            <button class="task-action edit" onclick="editTask('${task.id}')" title="Editar tarefa">
                <i class="fas fa-edit"></i>
            </button>
            <button class="task-action delete" onclick="confirmDeleteTask('${task.id}')" title="Excluir tarefa">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return taskDiv;
}

/**
 * Retorna as tarefas filtradas baseado no filtro atual e categoria selecionada
 */
function getFilteredTasks() {
    let filteredTasks = tasks;
    
    // Filtrar por categoria se uma estiver selecionada
    if (selectedCategoryId) {
        filteredTasks = filteredTasks.filter(task => task.categoryId === selectedCategoryId);
    }
    
    // Filtrar por status
    switch (currentFilter) {
        case 'completed':
            filteredTasks = filteredTasks.filter(task => task.completed);
            break;
        case 'pending':
            filteredTasks = filteredTasks.filter(task => !task.completed);
            break;
        // 'all' não precisa de filtro adicional
    }
    
    return filteredTasks;
}

/**
 * Atualiza as estatísticas na interface
 */
function updateStatistics() {
    if (!elements.totalTasks) return;
    
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    elements.totalTasks.textContent = total;
    elements.completedTasks.textContent = completed;
    elements.pendingTasks.textContent = pending;
}

/**
 * Atualiza o select de categorias nos modais
 */
function updateCategorySelect() {
    if (!elements.taskCategory) return;
    
    const currentValue = elements.taskCategory.value;
    elements.taskCategory.innerHTML = '';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        elements.taskCategory.appendChild(option);
    });
    
    // Restaurar valor selecionado se ainda existe
    if (currentValue && categories.find(cat => cat.id === currentValue)) {
        elements.taskCategory.value = currentValue;
    }
}

// =====================================
// FUNÇÕES DE INTERAÇÃO
// =====================================

/**
 * Seleciona uma categoria
 */
function selectCategory(categoryId, categoryName) {
    selectedCategoryId = categoryId;
    elements.categoryTitle.textContent = categoryName;
    
    // Atualizar visual das categorias
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('active');
    });
    
    event.currentTarget.classList.add('active');
    
    // Re-renderizar tarefas
    renderTasks();
}

/**
 * Define o filtro ativo
 */
function setActiveFilter(filter) {
    currentFilter = filter;
    
    // Atualizar visual dos filtros
    elements.filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    // Re-renderizar tarefas
    renderTasks();
}

/**
 * Alterna o estado de conclusão de uma tarefa
 */
window.toggleTaskComplete = async function(taskId, completed) {
    try {
        await updateTaskInFirebase(taskId, { completed });
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        // Reverter checkbox em caso de erro
        const checkbox = document.querySelector(`input[onchange*="${taskId}"]`);
        if (checkbox) {
            checkbox.checked = !completed;
        }
    }
};

/**
 * Retorna o texto da prioridade
 */
function getPriorityText(priority) {
    const priorities = {
        low: 'Baixa',
        medium: 'Média',
        high: 'Alta'
    };
    return priorities[priority] || 'Média';
}

// =====================================
// FUNÇÕES DE MODAL - CATEGORIAS
// =====================================

/**
 * Abre o modal de categoria
 */
function openCategoryModal(categoryId = null) {
    isEditingCategory = !!categoryId;
    editingCategoryId = categoryId;
    
    if (isEditingCategory) {
        const category = categories.find(cat => cat.id === categoryId);
        if (category) {
            elements.categoryModalTitle.textContent = 'Editar Categoria';
            elements.categoryName.value = category.name;
            elements.categoryIcon.value = category.icon;
            
            // Selecionar cor
            const colorRadio = document.querySelector(`input[name="categoryColor"][value="${category.color}"]`);
            if (colorRadio) {
                colorRadio.checked = true;
            }
        }
    } else {
        elements.categoryModalTitle.textContent = 'Nova Categoria';
        elements.categoryForm.reset();
        document.querySelector('input[name="categoryColor"]:first-child').checked = true;
    }
    
    elements.categoryModal.classList.remove('hidden');
    elements.categoryName.focus();
}

/**
 * Fecha o modal de categoria
 */
function closeCategoryModal() {
    elements.categoryModal.classList.add('hidden');
    elements.categoryForm.reset();
    isEditingCategory = false;
    editingCategoryId = null;
}

/**
 * Manipula o envio do formulário de categoria - CORRIGIDO
 */
async function handleCategorySubmit(e) {
    if (e) e.preventDefault();
    
    // Coletar dados do formulário
    const name = elements.categoryName.value.trim();
    const icon = elements.categoryIcon.value;
    const colorRadio = document.querySelector('input[name="categoryColor"]:checked');
    const color = colorRadio ? colorRadio.value : 'var(--color-primary)';
    
    // Validação básica
    if (!name) {
        elements.categoryName.focus();
        showFirebaseStatus('Por favor, insira um nome para a categoria', 'error');
        return;
    }
    
    const categoryData = { name, icon, color };
    
    try {
        if (isEditingCategory) {
            await updateCategoryInFirebase(editingCategoryId, categoryData);
        } else {
            await addCategoryToFirebase(categoryData);
        }
        
        closeCategoryModal();
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
    }
}

/**
 * Edita uma categoria
 */
window.editCategory = function(categoryId) {
    openCategoryModal(categoryId);
};

/**
 * Confirma exclusão de categoria
 */
window.confirmDeleteCategory = function(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
        const taskCount = tasks.filter(task => task.categoryId === categoryId).length;
        const message = taskCount > 0 
            ? `Tem certeza que deseja excluir a categoria "${category.name}"? Isso também excluirá ${taskCount} tarefa${taskCount !== 1 ? 's' : ''} relacionada${taskCount !== 1 ? 's' : ''}.`
            : `Tem certeza que deseja excluir a categoria "${category.name}"?`;
        
        showConfirmModal(message, () => deleteCategoryFromFirebase(categoryId));
    }
};

// =====================================
// FUNÇÕES DE MODAL - TAREFAS
// =====================================

/**
 * Abre o modal de tarefa
 */
function openTaskModal(taskId = null) {
    isEditingTask = !!taskId;
    editingTaskId = taskId;
    
    if (isEditingTask) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            elements.taskModalTitle.textContent = 'Editar Tarefa';
            elements.taskTitle.value = task.title;
            elements.taskDescription.value = task.description || '';
            elements.taskCategory.value = task.categoryId;
            elements.taskPriority.value = task.priority;
            elements.taskDueDate.value = task.dueDate || '';
        }
    } else {
        elements.taskModalTitle.textContent = 'Nova Tarefa';
        elements.taskForm.reset();
        
        // Selecionar categoria atual se uma estiver selecionada
        if (selectedCategoryId) {
            elements.taskCategory.value = selectedCategoryId;
        }
    }
    
    elements.taskModal.classList.remove('hidden');
    elements.taskTitle.focus();
}

/**
 * Fecha o modal de tarefa
 */
function closeTaskModal() {
    elements.taskModal.classList.add('hidden');
    elements.taskForm.reset();
    isEditingTask = false;
    editingTaskId = null;
}

/**
 * Manipula o envio do formulário de tarefa - CORRIGIDO
 */
async function handleTaskSubmit(e) {
    if (e) e.preventDefault();
    
    // Coletar dados do formulário
    const title = elements.taskTitle.value.trim();
    const description = elements.taskDescription.value.trim();
    const categoryId = elements.taskCategory.value;
    const priority = elements.taskPriority.value;
    const dueDate = elements.taskDueDate.value || null;
    
    // Validação básica
    if (!title) {
        elements.taskTitle.focus();
        showFirebaseStatus('Por favor, insira um título para a tarefa', 'error');
        return;
    }
    
    if (!categoryId) {
        elements.taskCategory.focus();
        showFirebaseStatus('Por favor, selecione uma categoria', 'error');
        return;
    }
    
    const taskData = { title, description, categoryId, priority, dueDate };
    
    try {
        if (isEditingTask) {
            await updateTaskInFirebase(editingTaskId, taskData);
        } else {
            await addTaskToFirebase(taskData);
        }
        
        closeTaskModal();
    } catch (error) {
        console.error('Erro ao salvar tarefa:', error);
    }
}

/**
 * Edita uma tarefa
 */
window.editTask = function(taskId) {
    openTaskModal(taskId);
};

/**
 * Confirma exclusão de tarefa
 */
window.confirmDeleteTask = function(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        showConfirmModal(
            `Tem certeza que deseja excluir a tarefa "${task.title}"?`,
            () => deleteTaskFromFirebase(taskId)
        );
    }
};

// =====================================
// FUNÇÕES DE MODAL - CONFIRMAÇÃO
// =====================================

let confirmCallback = null;

/**
 * Mostra modal de confirmação
 */
function showConfirmModal(message, callback) {
    elements.confirmMessage.textContent = message;
    confirmCallback = callback;
    elements.confirmModal.classList.remove('hidden');
}

/**
 * Fecha modal de confirmação
 */
function closeConfirmModal() {
    elements.confirmModal.classList.add('hidden');
    confirmCallback = null;
}

/**
 * Manipula confirmação de exclusão
 */
async function handleConfirmDelete() {
    if (confirmCallback) {
        try {
            await confirmCallback();
        } catch (error) {
            console.error('Erro ao executar exclusão:', error);
        }
    }
    closeConfirmModal();
}

/**
 * Fecha todos os modais
 */
function closeAllModals() {
    closeCategoryModal();
    closeTaskModal();
    closeConfirmModal();
}

// =====================================
// FUNÇÕES DE UI E FEEDBACK
// =====================================

/**
 * Mostra overlay de loading
 */
function showLoading(message = 'Carregando...') {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.querySelector('p').textContent = message;
        elements.loadingOverlay.classList.remove('hidden');
    }
}

/**
 * Esconde overlay de loading
 */
function hideLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.add('hidden');
    }
}

/**
 * Mostra status de conexão Firebase
 */
function showFirebaseStatus(message, type = 'success') {
    // Criar elemento de status se não existir
    let statusElement = document.querySelector('.firebase-status');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.className = 'firebase-status';
        document.body.appendChild(statusElement);
    }
    
    statusElement.textContent = message;
    statusElement.className = `firebase-status ${type} show`;
    
    // Esconder após 3 segundos
    setTimeout(() => {
        statusElement.classList.remove('show');
    }, 3000);
}

// =====================================
// CLEANUP E PERFORMANCE
// =====================================

/**
 * Cleanup ao fechar a página
 */
window.addEventListener('beforeunload', () => {
    if (categoriesListener) {
        categoriesListener();
    }
    if (tasksListener) {
        tasksListener();
    }
    console.log('🧹 Cleanup realizado');
});

/**
 * Log de performance
 */
window.addEventListener('load', () => {
    console.log('⚡ Página carregada em:', performance.now(), 'ms');
});

// =====================================
// EXPORTAÇÕES E DEBUG
// =====================================

// Expor funções globais para debug (apenas em desenvolvimento)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.TodoApp = {
        categories,
        tasks,
        db,
        elements,
        addCategoryToFirebase,
        addTaskToFirebase,
        updateTaskInFirebase,
        deleteTaskFromFirebase,
        showFirebaseStatus
    };
    console.log('🔧 Modo debug ativado - TodoApp disponível no console');
}

console.log('📱 Todo List Firebase App carregado com sucesso!');

/* 
 * =====================================
 * FIM DO ARQUIVO APP.JS
 * =====================================
 * 
 * Este arquivo contém toda a lógica da aplicação Todo List
 * integrada ao Firebase Firestore com sincronização em tempo real.
 * 
 * Para usar a aplicação:
 * 1. Configure as regras do Firestore conforme comentado no início
 * 2. Abra index.html em um servidor web
 * 3. A aplicação se conectará automaticamente ao Firebase
 * 4. Dados são sincronizados em tempo real entre todas as sessões
 */