/*
 * =====================================
 * TODO LIST FIREBASE - VERSÃO FINAL
 * =====================================
 *
 * ✅ Aplicação completa com todas as funcionalidades:
 * - Cards de categorias com contadores corretos
 * - Edição de categoria (botão ✏️ + double-click)
 * - CRUD completo de tarefas
 * - Múltiplas categorias por tarefa
 * - Drag-and-drop para reordenar
 * - Tarefas recorrentes semanais
 * - Sincronização em tempo real
 * - Interface responsiva
 */

// =====================================
// IMPORTAÇÕES FIREBASE CDN v12.3.0
// =====================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
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
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// =====================================
// CONFIGURAÇÃO FIREBASE
// =====================================

const firebaseConfig = {
    apiKey: "AIzaSyBGYD8QDpa5cLCUFoAF4SSHFFOywdElamk",
    authDomain: "todo-lojapronta.firebaseapp.com",
    projectId: "todo-lojapronta",
    storageBucket: "todo-lojapronta.firebasestorage.app",
    messagingSenderId: "922858854551",
    appId: "1:922858854551:web:140d02455a461e7425f1d2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase inicializado');

// =====================================
// CONSTANTES GLOBAIS
// =====================================

const COLLECTIONS = {
    CATEGORIES: 'categories',
    TASKS: 'tasks'
};

const DAYS_OF_WEEK = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
];

const AVAILABLE_ICONS = [
    '👥', '👤', '💼', '🛒', '📚', '💪', '🎯', '🏠', '🎨', '📱',
    '🍳', '🚗', '💰', '🎵', '📷', '🎮', '📝', '⭐', '🔥', '💡',
    '🌟', '🎉', '🏆', '📊', '🔧', '⚙️', '🌱'
];

const DEFAULT_CATEGORIES = [
    { id: 'candida-oliveira', name: 'Candida Oliveira', icon: '👥' },
    { id: 'sonilda-pires', name: 'Sonilda Pires', icon: '👥' },
    { id: 'natalia-carnauba', name: 'Natália Carnaúba', icon: '👥' },
    { id: 'joselita-sanchez', name: 'Joselita Sanchez', icon: '👥' },
    { id: 'edson-mori', name: 'Edson Mori', icon: '👥' }
];

// =====================================
// CLASSE PRINCIPAL DA APLICAÇÃO
// =====================================

class TodoApp {
    constructor() {
        console.log('🚀 Inicializando TodoApp...');

        // Estado da aplicação
        this.categories = [];
        this.tasks = {};
        this.currentCategory = null;
        this.editingCategory = null;
        this.editingTask = null;
        this.selectedIcon = null;
        this.deleteCallback = null;

        // Estado do drag-and-drop
        this.draggedCard = null;

        // Inicializar
        this.initializeElements();
        this.bindEvents();
        this.initializeFirebase();
    }

    /**
     * ========================================
     * INICIALIZAÇÃO DOS ELEMENTOS DOM
     * ========================================
     */
    initializeElements() {
        console.log('📋 Inicializando elementos DOM...');

        // Elementos principais
        this.categoriesGridEl = document.getElementById('categoriesGrid');
        this.tasksSectionEl = document.getElementById('tasksSection');
        this.categoryTitleEl = document.getElementById('categoryTitle');
        this.tasksListEl = document.getElementById('tasksList');

        // Estatísticas
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');

        // Botões
        this.addCategoryBtnEl = document.getElementById('addCategoryBtn');
        this.addTaskBtnEl = document.getElementById('addTaskBtn');

        // Input rápido
        this.quickTaskInputEl = document.getElementById('quickTaskInput');

        // Modais
        this.categoryModalEl = document.getElementById('categoryModal');
        this.taskModalEl = document.getElementById('taskModal');
        this.deleteModalEl = document.getElementById('deleteModal');

        // Elementos do modal de categoria
        this.categoryModalTitleEl = document.getElementById('categoryModalTitle');
        this.categoryNameInputEl = document.getElementById('categoryNameInput');
        this.iconGridEl = document.getElementById('iconGrid');
        this.closeCategoryModalEl = document.getElementById('closeCategoryModal');
        this.cancelCategoryBtnEl = document.getElementById('cancelCategoryBtn');
        this.saveCategoryBtnEl = document.getElementById('saveCategoryBtn');

        // Elementos do modal de tarefa
        this.taskModalTitleEl = document.getElementById('taskModalTitle');
        this.taskTextInputEl = document.getElementById('taskTextInput');
        this.isRecurringCheckboxEl = document.getElementById('isRecurringCheckbox');
        this.dayOfWeekGroupEl = document.getElementById('dayOfWeekGroup');
        this.dayOfWeekSelectEl = document.getElementById('dayOfWeekSelect');
        this.closeTaskModalEl = document.getElementById('closeTaskModal');
        this.cancelTaskBtnEl = document.getElementById('cancelTaskBtn');
        this.saveTaskBtnEl = document.getElementById('saveTaskBtn');

        // Múltiplas categorias
        this.addMultipleBtnEl = document.getElementById('addMultipleBtn');
        this.multipleCategoriesGroupEl = document.getElementById('multipleCategoriesGroup');
        this.categoriesListEl = document.getElementById('categoriesList');

        // Elementos do modal de exclusão
        this.deleteMessageEl = document.getElementById('deleteMessage');
        this.deleteInfoEl = document.getElementById('deleteInfo');
        this.closeDeleteModalEl = document.getElementById('closeDeleteModal');
        this.cancelDeleteBtnEl = document.getElementById('cancelDeleteBtn');
        this.confirmDeleteBtnEl = document.getElementById('confirmDeleteBtn');

        // Elementos de erro
        this.categoryNameErrorEl = document.getElementById('categoryNameError');
        this.iconErrorEl = document.getElementById('iconError');
        this.taskTextErrorEl = document.getElementById('taskTextError');
        this.dayOfWeekErrorEl = document.getElementById('dayOfWeekError');

        console.log('✅ Elementos DOM inicializados');
    }

    /**
     * ========================================
     * CONFIGURAÇÃO DE EVENT LISTENERS
     * ========================================
     */
    bindEvents() {
        console.log('🔗 Configurando event listeners...');

        // Botão de adicionar categoria
        this.addCategoryBtnEl?.addEventListener('click', () => {
            console.log('➕ Abrindo modal de categoria');
            this.openCategoryModal();
        });

        // Botão de adicionar tarefa
        this.addTaskBtnEl?.addEventListener('click', () => {
            console.log('➕ Abrindo modal de tarefa');
            this.openTaskModal();
        });

        // Input rápido de tarefa
        this.quickTaskInputEl?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const text = e.target.value.trim();
                if (text && this.currentCategory) {
                    console.log('⚡ Adicionando tarefa rápida:', text);
                    this.addTaskToFirebase(this.currentCategory.id, text);
                    e.target.value = '';
                }
            }
        });

        // Checkbox de recorrência
        this.isRecurringCheckboxEl?.addEventListener('change', (e) => {
            this.toggleDayOfWeekSelector(e.target.checked);
        });

        // Botão múltiplas categorias
        this.addMultipleBtnEl?.addEventListener('click', () => {
            this.toggleMultipleCategoriesSelector();
        });

        // Eventos dos modais
        this.bindModalEvents();

        console.log('✅ Event listeners configurados');
    }

    /**
     * ========================================
     * EVENTOS DOS MODAIS
     * ========================================
     */
    bindModalEvents() {
        // Modal de categoria
        this.closeCategoryModalEl?.addEventListener('click', () => this.closeCategoryModal());
        this.cancelCategoryBtnEl?.addEventListener('click', () => this.closeCategoryModal());
        this.saveCategoryBtnEl?.addEventListener('click', () => this.saveCategory());

        // Modal de tarefa
        this.closeTaskModalEl?.addEventListener('click', () => this.closeTaskModal());
        this.cancelTaskBtnEl?.addEventListener('click', () => this.closeTaskModal());
        this.saveTaskBtnEl?.addEventListener('click', () => this.saveTask());

        // Modal de exclusão
        this.closeDeleteModalEl?.addEventListener('click', () => this.closeDeleteModal());
        this.cancelDeleteBtnEl?.addEventListener('click', () => this.closeDeleteModal());
        this.confirmDeleteBtnEl?.addEventListener('click', () => this.executeDelete());

        // Fechar ao clicar no overlay
        [this.categoryModalEl, this.taskModalEl, this.deleteModalEl].forEach(modal => {
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    /**
     * ========================================
     * INICIALIZAÇÃO DO FIREBASE
     * ========================================
     */
    async initializeFirebase() {
        try {
            console.log('🔥 Configurando Firebase...');

            // Garantir categorias padrão
            await this.ensureDefaultCategories();

            // Garantir campo 'order'
            await this.ensureCategoryOrder();

            // Configurar listeners em tempo real
            this.setupRealtimeListeners();

            // Verificar tarefas recorrentes
            await this.checkAndRenewRecurringTasks();

            console.log('✅ Firebase configurado com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao inicializar Firebase:', error);
            this.showError('Erro ao conectar com Firebase.');
        }
    }

    /**
     * ========================================
     * GARANTIR CATEGORIAS PADRÃO
     * ========================================
     */
    async ensureDefaultCategories() {
        const snapshot = await getDocs(collection(db, COLLECTIONS.CATEGORIES));

        if (snapshot.empty) {
            console.log('📁 Criando categorias padrão...');

            for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
                const category = DEFAULT_CATEGORIES[i];
                await addDoc(collection(db, COLLECTIONS.CATEGORIES), {
                    ...category,
                    order: i,
                    createdAt: serverTimestamp()
                });
            }

            console.log('✅ Categorias padrão criadas');
        }
    }

    /**
     * ========================================
     * GARANTIR CAMPO ORDER
     * ========================================
     */
    async ensureCategoryOrder() {
        const snapshot = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
        const batch = writeBatch(db);
        let needsUpdate = false;

        snapshot.docs.forEach((docSnapshot, index) => {
            const data = docSnapshot.data();
            if (data.order === undefined) {
                const docRef = doc(db, COLLECTIONS.CATEGORIES, docSnapshot.id);
                batch.update(docRef, { order: index });
                needsUpdate = true;
            }
        });

        if (needsUpdate) {
            await batch.commit();
            console.log('🔄 Campo order adicionado');
        }
    }

    /**
     * ========================================
     * LISTENERS EM TEMPO REAL
     * ========================================
     */
    setupRealtimeListeners() {
        console.log('📶 Configurando listeners em tempo real...');

        // Listener para categorias
        const categoriesQuery = query(
            collection(db, COLLECTIONS.CATEGORIES),
            orderBy('order', 'asc')
        );

        onSnapshot(categoriesQuery, (snapshot) => {
            console.log('🔄 Categorias atualizadas, total:', snapshot.docs.length);

            this.categories = [];
            snapshot.forEach((doc) => {
                this.categories.push({
                    firebaseId: doc.id,
                    ...doc.data()
                });
            });

            console.log('📁 Categorias carregadas:', this.categories.map(c => c.name));

            // Renderizar cards
            this.renderCategoryCards();
        }, (error) => {
            console.error('❌ Erro no listener de categorias:', error);
        });

        // Listener para tarefas
        const tasksQuery = query(
            collection(db, COLLECTIONS.TASKS),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(tasksQuery, (snapshot) => {
            console.log('🔄 Tarefas atualizadas, total:', snapshot.docs.length);

            this.tasks = {};
            snapshot.forEach((doc) => {
                const task = {
                    firebaseId: doc.id,
                    ...doc.data()
                };

                if (!this.tasks[task.categoryId]) {
                    this.tasks[task.categoryId] = [];
                }
                this.tasks[task.categoryId].push(task);
            });

            console.log('📋 Estrutura this.tasks:', Object.keys(this.tasks));
            Object.keys(this.tasks).forEach(categoryId => {
                console.log(`  - categoryId "${categoryId}": ${this.tasks[categoryId].length} tarefa(s)`);
            });

            // Atualizar estatísticas globais
            this.updateGlobalStats();

            // Renderizar cards (para atualizar contadores)
            this.renderCategoryCards();

            // Renderizar tarefas se categoria selecionada
            if (this.currentCategory) {
                this.renderTasks();
            }

        }, (error) => {
            console.error('❌ Erro no listener de tarefas:', error);
        });

        console.log('✅ Listeners configurados');
    }

    /**
     * ========================================
     * ATUALIZAÇÃO DAS ESTATÍSTICAS GLOBAIS
     * ========================================
     */
    updateGlobalStats() {
        let totalTasks = 0;
        let completedTasks = 0;

        // Contar tarefas de TODAS as categorias
        Object.values(this.tasks).forEach(categoryTasks => {
            categoryTasks.forEach(task => {
                totalTasks++;
                if (task.completed) completedTasks++;
            });
        });

        const pendingTasks = totalTasks - completedTasks;

        // Atualizar elementos DOM
        if (this.totalTasksEl) this.totalTasksEl.textContent = totalTasks;
        if (this.completedTasksEl) this.completedTasksEl.textContent = completedTasks;
        if (this.pendingTasksEl) this.pendingTasksEl.textContent = pendingTasks;

        console.log(`📊 Stats globais: ${totalTasks} total, ${pendingTasks} pendentes, ${completedTasks} concluídas`);
    }

    /**
     * ========================================
     * RENDERIZAÇÃO DOS CARDS DE CATEGORIAS
     * ========================================
     */
    renderCategoryCards() {
        if (!this.categoriesGridEl) return;

        console.log('🎴 Renderizando', this.categories.length, 'cards de categorias...');

        this.categoriesGridEl.innerHTML = '';

        // Estado vazio
        if (this.categories.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <div class="empty-icon">📁</div>
                <h3 class="empty-title">Nenhuma categoria</h3>
                <p class="empty-description">Clique em "+Nova Categoria" para começar.</p>
            `;
            this.categoriesGridEl.appendChild(emptyState);
            return;
        }

        // Renderizar cada categoria
        this.categories.forEach((category, index) => {
            const card = this.createCategoryCard(category);
            this.categoriesGridEl.appendChild(card);

            // Debug do contador
            const categoryTasks = this.tasks[category.id] || [];
            console.log(`🎴 Card ${index + 1}: "${category.name}" → ${categoryTasks.length} tarefa(s)`);
        });

        console.log('✅ Cards renderizados');
    }

    /**
     * ========================================
     * CRIAÇÃO DO CARD DE CATEGORIA
     * ========================================
     * ✅ CORREÇÃO: Edição de categoria funcionando
     */
    createCategoryCard(category) {
        const categoryTasks = this.tasks[category.id] || [];
        const totalTasks = categoryTasks.length;

        // Debug detalhado
        console.log(`🔍 Criando card "${category.name}" (id: "${category.id}") → ${totalTasks} tarefa(s)`);

        // Criar elemento do card
        const card = document.createElement('div');
        card.className = 'category-card';
        card.draggable = true;
        card.dataset.categoryId = category.id;
        card.dataset.firebaseId = category.firebaseId;

        // Marcar como ativo se for a categoria atual
        if (this.currentCategory && this.currentCategory.id === category.id) {
            card.classList.add('active');
        }

        // Conteúdo do card
        card.innerHTML = `
            <div class="card-header">
                <span class="drag-handle">☰</span>
                <button class="edit-card-btn" title="Editar categoria">✏️</button>
                <button class="delete-card-btn" title="Excluir categoria">&times;</button>
            </div>

            <div class="card-icon">${category.icon}</div>
            <div class="card-name">${category.name}</div>
            <div class="card-count">${totalTasks} tarefa${totalTasks !== 1 ? 's' : ''}</div>
        `;

        // Event listener para seleção
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('drag-handle') ||
                e.target.classList.contains('delete-card-btn') ||
                e.target.classList.contains('edit-card-btn')) {
                return;
            }

            console.log('🎯 Categoria selecionada:', category.name);
            this.selectCategory(category);
        });

        // ✅ CORREÇÃO: Event listener para edição
        const editBtn = card.querySelector('.edit-card-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('✏️ Editando categoria:', category.name);
            this.openCategoryModal(category);
        });

        // Event listener para exclusão
        const deleteBtn = card.querySelector('.delete-card-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.confirmDeleteCategory(category);
        });

        // ✅ CORREÇÃO: Double-click para editar
        card.addEventListener('dblclick', (e) => {
            console.log('🔄 Edição rápida da categoria:', category.name);
            this.openCategoryModal(category);
        });

        // Drag-and-drop
        this.addDragDropEvents(card);

        return card;
    }

    /**
     * ========================================
     * DRAG-AND-DROP
     * ========================================
     */
    addDragDropEvents(card) {
        card.addEventListener('dragstart', (e) => {
            const isFromHandle = e.target.classList.contains('drag-handle') ||
                e.target.closest('.drag-handle');

            if (!isFromHandle) {
                e.preventDefault();
                return;
            }

            this.draggedCard = card;
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.dataset.firebaseId);
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            this.draggedCard = null;
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            if (this.draggedCard && this.draggedCard !== card) {
                const afterElement = this.getDragAfterElement(this.categoriesGridEl, e.clientY);

                if (afterElement == null) {
                    this.categoriesGridEl.appendChild(this.draggedCard);
                } else {
                    this.categoriesGridEl.insertBefore(this.draggedCard, afterElement);
                }
            }
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            this.saveNewCategoryOrder();
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.category-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    async saveNewCategoryOrder() {
        try {
            console.log('🔄 Salvando nova ordem das categorias...');

            const cards = [...this.categoriesGridEl.querySelectorAll('.category-card')];
            const batch = writeBatch(db);

            cards.forEach((card, index) => {
                const firebaseId = card.dataset.firebaseId;
                if (firebaseId) {
                    const docRef = doc(db, COLLECTIONS.CATEGORIES, firebaseId);
                    batch.update(docRef, { order: index });
                }
            });

            await batch.commit();
            console.log('✅ Nova ordem salva');

        } catch (error) {
            console.error('❌ Erro ao salvar ordem:', error);
        }
    }

    /**
     * ========================================
     * SELEÇÃO DE CATEGORIA
     * ========================================
     */
    selectCategory(category) {
        this.currentCategory = category;

        // Atualizar classes ativas
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('active');
        });

        const activeCard = document.querySelector(`[data-category-id="${category.id}"]`);
        if (activeCard) {
            activeCard.classList.add('active');
        }

        // Mostrar seção de tarefas
        this.categoryTitleEl.textContent = `${category.icon} ${category.name}`;
        this.tasksSectionEl.style.display = 'block';

        // Renderizar tarefas
        this.renderTasks();

        // Scroll para seção
        this.tasksSectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * ========================================
     * RENDERIZAÇÃO DAS TAREFAS
     * ========================================
     */
    renderTasks() {
        if (!this.currentCategory || !this.tasksListEl) return;

        console.log('📋 Renderizando tarefas da categoria:', this.currentCategory.name);

        this.tasksListEl.innerHTML = '';
        const categoryTasks = this.tasks[this.currentCategory.id] || [];

        console.log('Tarefas encontradas:', categoryTasks.length);

        if (categoryTasks.length === 0) {
            const emptyState = document.createElement('li');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <div class="empty-icon">✅</div>
                <h3 class="empty-title">Nenhuma tarefa</h3>
                <p class="empty-description">Adicione sua primeira tarefa!</p>
            `;
            this.tasksListEl.appendChild(emptyState);
            return;
        }

        // Renderizar cada tarefa
        categoryTasks.forEach((task, index) => {
            const taskItem = this.createTaskItem(task);
            this.tasksListEl.appendChild(taskItem);
            console.log(`📋 Tarefa ${index + 1}: ${task.text || 'undefined'} (${task.completed ? 'concluída' : 'pendente'})`);
        });

        console.log('✅ Tarefas renderizadas');
    }

    /**
     * ========================================
     * CRIAÇÃO DE ITEM DE TAREFA
     * ========================================
     */
    createTaskItem(task) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.taskId = task.id;

        // Garantir que task.text existe
        const taskText = task.text || '';
        console.log(`🔍 Criando tarefa: "${taskText}" (firebaseId: ${task.firebaseId})`);

        // Indicador de recorrência
        let recurringInfo = '';
        if (task.isRecurring && task.recurringDay !== undefined) {
            const dayName = DAYS_OF_WEEK[task.recurringDay];
            recurringInfo = `
                <div class="task-recurring">
                    <span>🔄</span>
                    <span>Renova: ${dayName}</span>
                </div>
            `;
        }

        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-text ${task.completed ? 'completed' : ''}">
                    ${taskText}
                </div>
                ${recurringInfo}
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit-task-btn" title="Editar tarefa">✏️</button>
                <button class="task-action-btn delete-task-btn" title="Excluir tarefa">🗑️</button>
            </div>
        `;

        // Event listeners para os botões
        const checkbox = li.querySelector('.task-checkbox');
        const editBtn = li.querySelector('.edit-task-btn');
        const deleteBtn = li.querySelector('.delete-task-btn');
        const taskTextEl = li.querySelector('.task-text');

        // Checkbox
        checkbox.addEventListener('change', (e) => {
            console.log('✅ Toggle tarefa:', taskText, e.target.checked ? 'concluída' : 'pendente');
            this.toggleTaskCompleted(task.firebaseId, e.target.checked);
        });

        // Botão de edição
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('✏️ Editando tarefa:', taskText);
            this.openTaskModal(taskText, task);
        });

        // Botão de exclusão - ✅ CORRIGIDO
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🗑️ Excluindo tarefa:', taskText, '(firebaseId:', task.firebaseId, ')');
            this.confirmDeleteTask(task);
        });

        // Double-click para editar
        taskTextEl.addEventListener('dblclick', () => {
            console.log('🔄 Edição rápida:', taskText);
            this.openTaskModal(taskText, task);
        });

        return li;
    }

    // ========================================
    // MÉTODOS FIREBASE CRUD
    // ========================================

    async addTaskToFirebase(categoryId, text) {
        try {
            console.log('➕ Adicionando tarefa:', text, 'na categoria:', categoryId);

            const newTask = {
                id: `task_${Date.now()}`,
                text: text,
                completed: false,
                categoryId: categoryId,
                isRecurring: false,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), newTask);
            console.log('✅ Tarefa adicionada com ID:', docRef.id);

        } catch (error) {
            console.error('❌ Erro ao adicionar tarefa:', error);
            this.showError('Erro ao adicionar tarefa.');
        }
    }

    async toggleTaskCompleted(firebaseId, completed) {
        try {
            console.log('✅ Atualizando status da tarefa:', firebaseId, 'para:', completed ? 'concluída' : 'pendente');

            await updateDoc(doc(db, COLLECTIONS.TASKS, firebaseId), {
                completed: completed
            });

            console.log('✅ Status atualizado');

        } catch (error) {
            console.error('❌ Erro ao atualizar tarefa:', error);
        }
    }

    // ========================================
    // TAREFAS RECORRENTES
    // ========================================

    async checkAndRenewRecurringTasks() {
        try {
            console.log('🔄 Verificando tarefas recorrentes...');

            const recurringQuery = query(
                collection(db, COLLECTIONS.TASKS),
                where('isRecurring', '==', true)
            );

            const snapshot = await getDocs(recurringQuery);
            const today = new Date();
            const todayDayOfWeek = today.getDay();

            let renewedCount = 0;

            for (const docSnap of snapshot.docs) {
                const task = { firebaseId: docSnap.id, ...docSnap.data() };

                if (this.shouldRenewTask(task, today, todayDayOfWeek)) {
                    await this.renewTask(docSnap.id, task);
                    renewedCount++;
                }
            }

            if (renewedCount > 0) {
                console.log(`🔄 ${renewedCount} tarefa(s) renovada(s)`);
            } else {
                console.log('🔄 Nenhuma tarefa precisou ser renovada');
            }

        } catch (error) {
            console.error('❌ Erro ao verificar recorrências:', error);
        }
    }

    shouldRenewTask(task, today, todayDayOfWeek) {
        if (task.recurringDay === undefined || task.recurringDay !== todayDayOfWeek) {
            return false;
        }

        if (!task.lastRenewed) {
            return true;
        }

        const lastRenewed = task.lastRenewed.toDate ? task.lastRenewed.toDate() : new Date(task.lastRenewed);
        const diffTime = today.getTime() - lastRenewed.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays >= 6;
    }

    async renewTask(firebaseId, task) {
        try {
            await updateDoc(doc(db, COLLECTIONS.TASKS, firebaseId), {
                completed: false,
                lastRenewed: serverTimestamp()
            });
            console.log('🔄 Tarefa renovada:', task.text);
        } catch (error) {
            console.error('❌ Erro ao renovar tarefa:', error);
        }
    }

    // ========================================
    // MODAIS
    // ========================================

    openCategoryModal(category = null) {
        this.editingCategory = category;

        const isEditing = category !== null;
        this.categoryModalTitleEl.textContent = isEditing ? 'Editar Categoria' : 'Nova Categoria';
        this.saveCategoryBtnEl.textContent = isEditing ? 'Salvar' : 'Criar';

        if (isEditing) {
            // ✅ CORREÇÃO: Preencher dados da categoria para edição
            this.categoryNameInputEl.value = category.name;
            this.selectedIcon = category.icon;
            console.log('✏️ Editando categoria:', category.name, 'com ícone:', category.icon);
        } else {
            this.categoryNameInputEl.value = '';
            this.selectedIcon = null;
        }

        this.renderIconGrid();
        this.clearErrors();
        this.categoryModalEl.style.display = 'flex';

        setTimeout(() => this.categoryNameInputEl.focus(), 100);
    }

    openTaskModal(initialText = '', task = null) {
        if (!this.currentCategory) {
            this.showError('Selecione uma categoria primeiro.');
            return;
        }

        this.editingTask = task;

        const isEditing = task !== null;
        this.taskModalTitleEl.textContent = isEditing ? 'Editar Tarefa' : 'Nova Tarefa';
        this.saveTaskBtnEl.textContent = isEditing ? 'Salvar' : 'Adicionar';

        this.taskTextInputEl.value = initialText;

        if (isEditing) {
            this.isRecurringCheckboxEl.checked = task.isRecurring || false;
            this.dayOfWeekSelectEl.value = task.recurringDay !== undefined ? task.recurringDay.toString() : '';
        } else {
            this.isRecurringCheckboxEl.checked = false;
            this.dayOfWeekSelectEl.value = '';
        }

        this.toggleDayOfWeekSelector(this.isRecurringCheckboxEl.checked);

        // Reset múltiplas categorias
        this.multipleCategoriesGroupEl.style.display = 'none';

        this.clearErrors();
        this.taskModalEl.style.display = 'flex';

        setTimeout(() => this.taskTextInputEl.focus(), 100);
    }

    toggleDayOfWeekSelector(show) {
        this.dayOfWeekGroupEl.style.display = show ? 'block' : 'none';
        if (!show) {
            this.dayOfWeekSelectEl.value = '';
        }
    }

    toggleMultipleCategoriesSelector() {
        const isVisible = this.multipleCategoriesGroupEl.style.display === 'block';

        if (isVisible) {
            this.multipleCategoriesGroupEl.style.display = 'none';
        } else {
            this.multipleCategoriesGroupEl.style.display = 'block';
            this.renderCategoriesList();
        }
    }

    renderCategoriesList() {
        if (!this.categoriesListEl) return;

        this.categoriesListEl.innerHTML = '';

        this.categories.forEach(category => {
            const isCurrentCategory = this.currentCategory && category.id === this.currentCategory.id;

            const div = document.createElement('div');
            div.className = `category-option ${isCurrentCategory ? 'disabled' : ''}`;

            div.innerHTML = `
                <input
                    type="checkbox"
                    id="cat_${category.id}"
                    value="${category.id}"
                    ${isCurrentCategory ? 'checked disabled' : ''}
                >
                <label for="cat_${category.id}">
                    ${category.icon} ${category.name}
                    ${isCurrentCategory ? ' (atual)' : ''}
                </label>
            `;

            this.categoriesListEl.appendChild(div);
        });
    }

    renderIconGrid() {
        this.iconGridEl.innerHTML = '';

        AVAILABLE_ICONS.forEach((icon) => {
            const iconElement = document.createElement('div');
            iconElement.className = 'icon-option';
            iconElement.textContent = icon;

            if (icon === this.selectedIcon) {
                iconElement.classList.add('selected');
            }

            iconElement.addEventListener('click', () => {
                document.querySelectorAll('.icon-option').forEach(el => {
                    el.classList.remove('selected');
                });

                iconElement.classList.add('selected');
                this.selectedIcon = icon;
            });

            this.iconGridEl.appendChild(iconElement);
        });
    }

    async saveCategory() {
        try {
            const name = this.categoryNameInputEl.value.trim();

            if (!name) {
                this.showFieldError('categoryNameError', 'Nome da categoria é obrigatório');
                return;
            }

            if (!this.selectedIcon) {
                this.showFieldError('iconError', 'Selecione um ícone');
                return;
            }

            console.log('💾 Salvando categoria:', name);

            if (this.editingCategory) {
                // ✅ CORREÇÃO: Atualizando categoria existente
                console.log('🔄 Atualizando categoria existente:', this.editingCategory.firebaseId);
                await updateDoc(doc(db, COLLECTIONS.CATEGORIES, this.editingCategory.firebaseId), {
                    name: name,
                    icon: this.selectedIcon
                });
            } else {
                const maxOrder = Math.max(...this.categories.map(c => c.order || 0), -1);

                await addDoc(collection(db, COLLECTIONS.CATEGORIES), {
                    id: `cat_${Date.now()}`,
                    name: name,
                    icon: this.selectedIcon,
                    order: maxOrder + 1,
                    createdAt: serverTimestamp()
                });
            }

            console.log('✅ Categoria salva');
            this.closeCategoryModal();

        } catch (error) {
            console.error('❌ Erro ao salvar categoria:', error);
            this.showError('Erro ao salvar categoria.');
        }
    }

    async saveTask() {
        try {
            const text = this.taskTextInputEl.value.trim();
            const isRecurring = this.isRecurringCheckboxEl.checked;
            const recurringDay = this.dayOfWeekSelectEl.value;

            if (!text) {
                this.showFieldError('taskTextError', 'Descrição da tarefa é obrigatória');
                return;
            }

            if (isRecurring && !recurringDay) {
                this.showFieldError('dayOfWeekError', 'Selecione o dia da semana');
                return;
            }

            console.log('💾 Salvando tarefa:', text);

            // Coletar categorias selecionadas para múltiplas categorias
            const selectedCategories = [];

            // Sempre incluir categoria atual
            selectedCategories.push(this.currentCategory.id);

            // Se modo múltiplas categorias estiver ativo, coletar selecionadas
            if (this.multipleCategoriesGroupEl.style.display === 'block') {
                const checkboxes = this.categoriesListEl.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)');
                checkboxes.forEach(cb => {
                    if (cb.value !== this.currentCategory.id) {
                        selectedCategories.push(cb.value);
                    }
                });
            }

            console.log('📁 Categorias selecionadas:', selectedCategories);

            const taskData = {
                text: text,
                isRecurring: isRecurring,
                originalText: text
            };

            if (isRecurring) {
                taskData.recurringDay = parseInt(recurringDay);
                taskData.lastRenewed = serverTimestamp();
            } else {
                taskData.recurringDay = null;
                taskData.lastRenewed = null;
            }

            if (this.editingTask) {
                // Editando tarefa existente
                await updateDoc(doc(db, COLLECTIONS.TASKS, this.editingTask.firebaseId), {
                    ...taskData,
                    categoryId: this.currentCategory.id
                });
            } else {
                // Criando nova(s) tarefa(s)
                const promises = selectedCategories.map(categoryId => {
                    return addDoc(collection(db, COLLECTIONS.TASKS), {
                        ...taskData,
                        id: `task_${Date.now()}_${categoryId}`,
                        categoryId: categoryId,
                        completed: false,
                        createdAt: serverTimestamp()
                    });
                });

                await Promise.all(promises);
                console.log(`✅ Tarefa criada em ${selectedCategories.length} categoria(s)`);
            }

            console.log('✅ Tarefa salva');
            this.closeTaskModal();

        } catch (error) {
            console.error('❌ Erro ao salvar tarefa:', error);
            this.showError('Erro ao salvar tarefa.');
        }
    }

    // ========================================
    // EXCLUSÕES
    // ========================================

    confirmDeleteCategory(category) {
        const categoryTasks = this.tasks[category.id] || [];
        const taskCount = categoryTasks.length;

        this.deleteMessageEl.textContent = `Excluir categoria "${category.name}"?`;

        if (taskCount > 0) {
            this.deleteInfoEl.innerHTML = `
                <strong>Atenção:</strong> Esta ação excluirá ${taskCount} tarefa(s).
            `;
        } else {
            this.deleteInfoEl.innerHTML = '';
        }

        this.deleteCallback = () => this.deleteCategory(category);
        this.deleteModalEl.style.display = 'flex';
    }

    confirmDeleteTask(task) {
        this.deleteMessageEl.textContent = `Excluir tarefa "${task.text || 'sem nome'}"?`;
        this.deleteInfoEl.innerHTML = task.isRecurring ?
            '<strong>Esta é uma tarefa recorrente.</strong>' : '';

        this.deleteCallback = () => this.deleteTask(task);
        this.deleteModalEl.style.display = 'flex';
    }

    async deleteCategory(category) {
        try {
            console.log('🗑️ Excluindo categoria:', category.name);

            const categoryTasks = this.tasks[category.id] || [];
            for (const task of categoryTasks) {
                await deleteDoc(doc(db, COLLECTIONS.TASKS, task.firebaseId));
            }

            await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, category.firebaseId));

            if (this.currentCategory && this.currentCategory.id === category.id) {
                this.currentCategory = null;
                this.tasksSectionEl.style.display = 'none';
            }

            console.log('✅ Categoria excluída');

        } catch (error) {
            console.error('❌ Erro ao excluir categoria:', error);
            this.showError('Erro ao excluir categoria.');
        }
    }

    async deleteTask(task) {
        try {
            console.log('🗑️ Excluindo tarefa:', task.text, '(firebaseId:', task.firebaseId, ')');

            if (!task.firebaseId) {
                console.error('❌ Task sem firebaseId:', task);
                this.showError('Erro: tarefa sem ID válido.');
                return;
            }

            await deleteDoc(doc(db, COLLECTIONS.TASKS, task.firebaseId));

            console.log('✅ Tarefa excluída');

        } catch (error) {
            console.error('❌ Erro ao excluir tarefa:', error);
            this.showError('Erro ao excluir tarefa.');
        }
    }

    // ========================================
    // UTILITÁRIOS
    // ========================================

    closeCategoryModal() {
        this.categoryModalEl.style.display = 'none';
        this.editingCategory = null;
        this.selectedIcon = null;
        this.clearErrors();
    }

    closeTaskModal() {
        this.taskModalEl.style.display = 'none';
        this.editingTask = null;
        this.multipleCategoriesGroupEl.style.display = 'none';
        this.clearErrors();
    }

    closeDeleteModal() {
        this.deleteModalEl.style.display = 'none';
        this.deleteCallback = null;
    }

    executeDelete() {
        if (this.deleteCallback) {
            this.deleteCallback();
        }
        this.closeDeleteModal();
    }

    showFieldError(fieldId, message) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.classList.remove('show');
        });
    }

    showError(message) {
        console.error('❌ ' + message);
        alert(message);
    }
}

// =====================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM carregado, iniciando TodoApp...');
    new TodoApp();
});
