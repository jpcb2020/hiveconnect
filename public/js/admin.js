// Admin Panel JavaScript - ConexBot

// API endpoints
const API = {
    dashboard: '/api/admin/dashboard',
    users: '/api/admin/users',
    createUser: '/api/admin/users',
    updateUser: (id) => `/api/admin/users/${id}`,
    updateUserRole: (id) => `/api/admin/users/${id}/role`,
    deleteUser: (id) => `/api/admin/users/${id}`,
    logout: '/logout'
};

// Global variables
let users = [];
let filteredUsers = [];
let currentPage = 1;
let usersPerPage = 10;
let editingUserId = null;

// API helper - usar AuthManager global
async function apiRequest(url, options = {}) {
    // Verificar se AuthManager está disponível
    if (typeof AuthManager === 'undefined') {
        throw new Error('AuthManager não disponível');
    }

    // Verificar autenticação antes da requisição
    if (!AuthManager.isAuthenticated() || AuthManager.isTokenExpired()) {
        showAlertModal('Sessão expirada. Redirecionando para login...', 'warning');
        setTimeout(() => {
            AuthManager.logout();
        }, 2000);
        return null;
    }
    
    const defaultOptions = {
        headers: AuthManager.getAuthHeaders()
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            showAlertModal('Sessão expirada. Redirecionando para login...', 'warning');
            setTimeout(() => {
                AuthManager.logout();
            }, 2000);
            return null;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ msg: 'Erro desconhecido' }));
            throw new Error(errorData.msg || `Erro ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Alert Modal Functions
function showAlertModal(message, type = 'info', confirmCallback = null) {
    const modal = document.createElement('div');
    modal.className = `alert-modal ${type}`;
    
    const content = document.createElement('div');
    content.className = 'alert-modal-content';
    
    const icon = document.createElement('div');
    icon.className = 'alert-modal-icon';
    icon.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 
                                       type === 'error' ? 'times-circle' : 
                                       type === 'warning' ? 'exclamation-triangle' : 
                                       'info-circle'}"></i>`;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert-modal-message';
    messageDiv.textContent = message;
    
    const buttons = document.createElement('div');
    buttons.className = 'alert-modal-buttons';
    
    if (confirmCallback) {
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'alert-modal-btn primary';
        confirmBtn.textContent = 'Confirmar';
        confirmBtn.onclick = () => {
            closeModal();
            confirmCallback();
        };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'alert-modal-btn secondary';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.onclick = closeModal;
        
        buttons.appendChild(confirmBtn);
        buttons.appendChild(cancelBtn);
    } else {
        const okBtn = document.createElement('button');
        okBtn.className = 'alert-modal-btn primary';
        okBtn.textContent = 'OK';
        okBtn.onclick = closeModal;
        buttons.appendChild(okBtn);
    }
    
    content.appendChild(icon);
    content.appendChild(messageDiv);
    content.appendChild(buttons);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Trigger reflow to enable transitions
    modal.offsetHeight;
    modal.classList.add('show');
    
    function closeModal() {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    initializeEventListeners();
    await loadDashboardData();
    await loadUsers();
});

function initializeEventListeners() {
    // Modal controls
    const userModal = document.getElementById('userModal');
    const filterModal = document.getElementById('filterModal');
    const addUserBtn = document.getElementById('addUserBtn');
    const filterBtn = document.getElementById('filterBtn');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    // Forms
    const userForm = document.getElementById('userForm');
    const filterForm = document.getElementById('filterForm');
    
    // Profile dropdown
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Table controls
    const searchInput = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    // Add user modal
    addUserBtn.addEventListener('click', () => {
        openUserModal();
    });

    // Filter modal
    filterBtn.addEventListener('click', () => {
        filterModal.style.display = 'block';
    });

    // Close modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Profile dropdown
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        profileDropdown.classList.remove('active');
    });

    profileDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        showAlertModal('Tem certeza que deseja sair?', 'warning', handleLogout);
    });

    // Search
    searchInput.addEventListener('input', handleSearch);

    // Refresh
    refreshBtn.addEventListener('click', () => {
        loadUsers();
        loadDashboardData();
    });

    // Forms
    userForm.addEventListener('submit', handleUserFormSubmit);
    filterForm.addEventListener('submit', handleFilterSubmit);
    clearFiltersBtn.addEventListener('click', clearFilters);

    // Clear error messages on input
    document.getElementById('name').addEventListener('input', clearErrorMessages);
    document.getElementById('email').addEventListener('input', clearErrorMessages);
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const data = await apiRequest(API.dashboard);
        if (data && data.stats) {
            document.getElementById('totalUsers').textContent = data.stats.totalUsers;
            document.getElementById('adminUsers').textContent = data.stats.adminUsers;
            document.getElementById('regularUsers').textContent = data.stats.regularUsers;
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlertModal('Erro ao carregar dados do dashboard', 'error');
    }
}

// User management functions
async function loadUsers() {
    try {
        const data = await apiRequest(API.users);
        if (data && data.users) {
            users = data.users;
            filteredUsers = [...users];
            updateTable();
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showAlertModal('Erro ao carregar usuários', 'error');
    }
}

function openUserModal(user = null) {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const modalTitle = document.querySelector('#userModal .modal-header h2');
    const passwordField = document.getElementById('password');
    const passwordContainer = passwordField.parentElement;
    const editPasswordGroup = document.getElementById('editPasswordGroup');
    const newPasswordField = document.getElementById('newPassword');
    
    form.reset();
    clearErrorMessages();
    
    if (user) {
        editingUserId = user.id;
        modalTitle.textContent = 'Editar Usuário';
        document.getElementById('name').value = user.name;
        document.getElementById('email').value = user.email;
        document.getElementById('role').value = user.role;
        
        // Hide create password field and show edit password field
        passwordContainer.style.display = 'none';
        passwordField.removeAttribute('required');
        editPasswordGroup.style.display = 'block';
        newPasswordField.value = ''; // Clear the new password field
    } else {
        editingUserId = null;
        modalTitle.textContent = 'Adicionar Usuário';
        
        // Show create password field and hide edit password field
        passwordContainer.style.display = 'block';
        passwordField.setAttribute('required', '');
        editPasswordGroup.style.display = 'none';
        passwordField.value = ''; // Clear the password field
    }
    
    modal.style.display = 'block';
}

async function handleUserFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData);
    
    console.log('Submitting user form:', { editingUserId, userData });
    
    try {
        if (editingUserId) {
            console.log('Updating user for ID:', editingUserId);
            
            // Prepare update data
            const updateData = {
                name: userData.name,
                email: userData.email,
                role: userData.role
            };
            
            // Only include password if newPassword field has a value
            const newPassword = document.getElementById('newPassword').value.trim();
            if (newPassword) {
                // Validar comprimento da senha
                if (newPassword.length < 6) {
                    showAlertModal('A nova senha deve ter pelo menos 6 caracteres', 'error');
                    return;
                }
                updateData.password = newPassword;
            }
            
            console.log('Update data:', updateData);
            
            // Update user (name, email, role, and optionally password)
            const response = await apiRequest(API.updateUser(editingUserId), {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            console.log('Update response:', response);
            showAlertModal('Usuário atualizado com sucesso!', 'success');
        } else {
            console.log('Creating new user');
            
            // Validar comprimento da senha para novo usuário
            if (userData.password && userData.password.length < 6) {
                showAlertModal('A senha deve ter pelo menos 6 caracteres', 'error');
                return;
            }
            
            // Create new user
            const response = await apiRequest(API.createUser, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            console.log('Create response:', response);
            showAlertModal('Usuário criado com sucesso!', 'success');
        }
        
        document.getElementById('userModal').style.display = 'none';
        await loadUsers();
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error saving user:', error);
        showAlertModal(`Erro ao salvar usuário: ${error.message}`, 'error');
    }
}

async function deleteUser(userId) {
    console.log('Attempting to delete user with ID:', userId);
    
    showAlertModal('Tem certeza que deseja deletar este usuário?', 'warning', async () => {
        try {
            console.log('Deleting user ID:', userId);
            const response = await apiRequest(API.deleteUser(userId), {
                method: 'DELETE'
            });
            console.log('Delete response:', response);
            showAlertModal('Usuário deletado com sucesso!', 'success');
            await loadUsers();
            await loadDashboardData();
        } catch (error) {
            console.error('Error deleting user:', error);
            showAlertModal(`Erro ao deletar usuário: ${error.message}`, 'error');
        }
    });
}

// Table functions
function updateTable() {
    const tbody = document.getElementById('usersTableBody');
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const pageUsers = filteredUsers.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    pageUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td>${new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
            <td>${new Date(user.updated_at).toLocaleDateString('pt-BR')}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" data-user-id="${user.id}" data-action="edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-user-id="${user.id}" data-action="delete"
                            ${user.id === window.currentUser.id ? 'disabled title="Não é possível deletar sua própria conta"' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Adicionar event listeners para os botões de ação
    addActionButtonListeners();
    updatePaginationControls();
}

// Função para adicionar event listeners aos botões de ação
function addActionButtonListeners() {
    // Botões de editar
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = parseInt(e.currentTarget.dataset.userId);
            const user = users.find(u => u.id === userId);
            if (user) {
                openUserModal(user);
            } else {
                showAlertModal('Erro: Usuário não encontrado', 'error');
            }
        });
    });

    // Botões de deletar
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.currentTarget.disabled) return;
            
            const userId = parseInt(e.currentTarget.dataset.userId);
            const user = users.find(u => u.id === userId);
            if (user) {
                deleteUser(userId);
            } else {
                showAlertModal('Erro: Usuário não encontrado', 'error');
            }
        });
    });
}

function updatePaginationControls() {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
    
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    };
    
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    };
}

// Search and filter functions
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    updateTable();
}

function handleFilterSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const filters = Object.fromEntries(formData);
    
    filteredUsers = users.filter(user => {
        return Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            return user[key] === value;
        });
    });
    
    currentPage = 1;
    updateTable();
    document.getElementById('filterModal').style.display = 'none';
}

function clearFilters() {
    document.getElementById('filterForm').reset();
    document.getElementById('searchInput').value = '';
    filteredUsers = [...users];
    currentPage = 1;
    updateTable();
    document.getElementById('filterModal').style.display = 'none';
}

// Utility functions
function clearErrorMessages() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

async function handleLogout() {
    try {
        // Usar AuthManager para logout consistente
        if (typeof AuthManager !== 'undefined') {
            AuthManager.logout();
        } else {
            // Fallback se AuthManager não estiver disponível
        await fetch(API.logout);
        localStorage.clear();
        sessionStorage.clear();
        document.cookie = 'jwtToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if API fails
        localStorage.clear();
        sessionStorage.clear();
        document.cookie = 'jwtToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
    }
} 