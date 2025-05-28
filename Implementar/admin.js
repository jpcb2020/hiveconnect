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
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const userModal = document.getElementById('userModal');
    const filterModal = document.getElementById('filterModal');
    const addUserBtn = document.getElementById('addUserBtn');
    const filterBtn = document.querySelector('.filter-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const userForm = document.getElementById('userForm');
    const filterForm = document.getElementById('filterForm');
    const roleSelect = document.getElementById('role');
    const userOnlyFields = document.querySelectorAll('.user-only');
    const searchInput = document.getElementById('searchInput');
    const phoneInput = document.getElementById('phone');
    const cpfInput = document.getElementById('cpf');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    const passwordInput = document.getElementById('password');
    const sortIdBtn = document.getElementById('sortIdBtn');
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');

    // Function to clear and hide error messages
    function clearErrorMessages() {
        nameError.textContent = '';
        emailError.textContent = '';
        nameError.style.display = 'none';
        emailError.style.display = 'none';
    }

    // Initialize password toggle functionality
    function initializePasswordToggle() {
        // Remove existing toggle button if present
        const existingToggleBtn = passwordInput.parentElement.querySelector('.toggle-password');
        if (existingToggleBtn) {
            existingToggleBtn.remove();
        }
        
        const togglePasswordBtn = document.createElement('button');
        togglePasswordBtn.type = 'button';
        togglePasswordBtn.className = 'toggle-password';
        togglePasswordBtn.innerHTML = '<i class="fas fa-eye"></i>';
        passwordInput.parentElement.style.position = 'relative';
        passwordInput.parentElement.appendChild(togglePasswordBtn);
    
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePasswordBtn.innerHTML = `<i class="fas fa-${type === 'password' ? 'eye' : 'eye-slash'}"></i>`;
        });
    }

    // Initialize password toggle on page load
    initializePasswordToggle();

    // Clear error messages on input change
    document.getElementById('name').addEventListener('input', clearErrorMessages);
    document.getElementById('email').addEventListener('input', clearErrorMessages);

    // Toggle profile dropdown
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        profileDropdown.classList.remove('active');
    });

    // Prevent dropdown from closing when clicking inside it
    profileDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Handle logout
    logoutBtn.addEventListener('click', () => {
        showAlertModal('Tem certeza que deseja sair?', 'warning', () => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../login/login.html';
        })
    });

    // Toggle modals
    addUserBtn.addEventListener('click', () => {
        userModal.style.display = 'block';
        userForm.reset();
        clearErrorMessages();
        document.querySelector('.modal-header h2').textContent = 'Adicionar Usuário';
        toggleUserOnlyFields('user');
        initializePasswordToggle(); // Reinitialize password toggle for new user
    });

    filterBtn.addEventListener('click', () => {
        filterModal.style.display = 'block';
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            userModal.style.display = 'none';
            filterModal.style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === userModal) userModal.style.display = 'none';
        if (e.target === filterModal) filterModal.style.display = 'none';
    });

    // Toggle user-only fields based on role
    roleSelect.addEventListener('change', () => {
        toggleUserOnlyFields(roleSelect.value);
    });

    function toggleUserOnlyFields(role) {
        userOnlyFields.forEach(field => {
            field.style.display = role === 'admin' ? 'none' : 'block';
        });
    }

    let editingUserId = null;

    // Phone number mask
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        if (value.length > 0) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1)$2-$3');
        }
        e.target.value = value;
    });

    // CPF mask
    cpfInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        if (value.length > 0) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
        }
        e.target.value = value;
    });

    // Handle user form submission
    userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const phone = phoneInput.value.replace(/\D/g, '');
        const cpf = cpfInput?.value.replace(/\D/g, '');
        const email = document.getElementById('email').value;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlertModal('Por favor, insira um endereço de email válido', 'error')
            return;
        }

        // Validate plan expiration date
        const planExpiration = document.getElementById('planExpiration').value;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expirationDate = new Date(planExpiration);
        if (expirationDate <= today) {
            showAlertModal('A data de vencimento do plano deve ser posterior à data atual', 'error')
            return;
        }

        // Validate CPF if user role
        if (cpf && cpf.length !== 11) {
            showAlertModal('Por favor, insira um CPF válido no formato XXX.XXX.XXX-XX', 'error')
            return;
        }

        const formData = {
            name: document.getElementById('name').value,
            companyName: document.getElementById('companyName').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            phone: phoneInput.value,
            role: 'user',
            cpf: cpfInput.value,
            planExpiration: document.getElementById('planExpiration').value
        };

        if (editingUserId !== null) {
            // Editing existing user
            formData.id = editingUserId;
            
            // Get auth token from storage
            const token = getAuthToken();
            
            // Send data to edit user endpoint
            fetch('https://n8n-n8n.ld9tly.easypanel.host/webhook/edituser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.sucess === "sucess") {
                    showAlertModal('Usuário atualizado com sucesso!', 'success');
                    const index = users.findIndex(u => u.id === editingUserId);
                    if (index !== -1) {
                        formData.role = users[index].role;
                        users[index] = formData;
                    }
                    updateTable();
                    userModal.style.display = 'none';
                    userForm.reset();
                    editingUserId = null;
                    initializePasswordToggle();
                } else {
                    showAlertModal('Erro ao atualizar usuário. Resposta inesperada.', 'error');
                }
            })
            .catch(error => {
                console.error('Error updating user:', error);
                showAlertModal('Erro ao atualizar usuário. Por favor, tente novamente.', 'error');
            });
            
            return; // Exit the function after sending edit request
        } else {
            // Adding new user
            formData.id = users.length + 1;
        }

        // Get auth token from storage
        const token = getAuthToken();

        // Send data to example URL with auth token in header
        fetch('https://n8n-n8n.ld9tly.easypanel.host/webhook/createuser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
.then(data => {
            if (data.nameexist === "nameexist") {
                nameError.textContent = 'Nome de usuário já existe.';
                nameError.style.display = 'block';
            } else if (data.emailexist === "emailexist") {
                emailError.textContent = 'Email já existe.';
                emailError.style.display = 'block';
            } else if (data.sucess === "sucess") {
                showAlertModal('Usuário salvo com sucesso!', 'success');
                if (editingUserId !== null) {
                    const index = users.findIndex(u => u.id === editingUserId);
                    if (index !== -1) {
                        formData.role = users[index].role;
                        users[index] = formData;
                    }
                } else {
                    users.push(formData)
                }
                updateTable();
                userModal.style.display = 'none';
                userForm.reset();
                initializePasswordToggle(); // Reinitialize password toggle after form reset
            } else {
                showAlertModal('Erro ao salvar usuário. Resposta inesperada.', 'error');
            }
        })
        .catch(error => {
            console.error('Error saving user:', error);
            showAlertModal('Erro ao salvar usuário. Por favor, tente novamente.', 'error');
        });
    });

    // Handle filter form submission
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const planStatus = document.getElementById('filterPlanStatus').value;

        let filteredUsers = users;

        if (planStatus) {
            const today = new Date();
            filteredUsers = filteredUsers.filter(user => {
                const expiration = new Date(user.planExpiration);
                return planStatus === 'active' ? expiration > today : expiration <= today;
            });
        }

        updateTable(filteredUsers);
        filterModal.style.display = 'none';
    });

    // Handle search
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredUsers = users.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.cpf.toLowerCase().includes(searchTerm) ||
            user.companyName.toLowerCase().includes(searchTerm)
        );
        updateTable(filteredUsers);
    });

    // Sort direction state
    let sortDirection = 'asc';
    
    // Handle ID sorting
    sortIdBtn.addEventListener('click', () => {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        
        // Update sort button icon
        const icon = sortIdBtn.querySelector('i');
        icon.className = sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        
        // Sort and update table
        updateTable();
    });
    
    // Update table with users data
    function updateTable(data = users) {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        // Check if data is empty or null
        if (!data || data.length === 0) {
            tbody.innerHTML = ''; // Clear table body
            updatePaginationControls(1, 1, 0);
            return; // Exit the function if no data
        }

        // Sort data if sort direction is set
        const sortedData = [...data].sort((a, b) => {
            if (sortDirection === 'asc') {
                return a.id - b.id;
            } else {
                return b.id - a.id;
            }
        });

        // Pagination variables
        const itemsPerPage = 9;
        const currentPage = currentPageNumber || 1;
        const totalPages = Math.ceil(sortedData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageData = sortedData.slice(startIndex, endIndex);

        // Display current page data
        currentPageData.forEach(user => {
            const tr = document.createElement('tr');
            const formattedDate = user.planExpiration ? new Date(user.planExpiration).toLocaleDateString('pt-BR') : '-';
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.companyName || '-'}</td>
                <td>${user.email}</td>
                <td>********</td>
                <td>${user.cpf || '-'}</td>
                <td>${user.phone || '-'}</td>
                <td>${formattedDate}</td>
                <td>${user.role === 'admin' ? 'Admin' : 'Usuário'}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="editUser(${user.id})"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" onclick="deleteUser(${user.id})"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Update pagination controls
        updatePaginationControls(currentPage, totalPages, data.length);
    }

    // Initialize pagination variables
    let currentPageNumber = 1;

    // Function to update pagination controls
    function updatePaginationControls(currentPage, totalPages, totalItems) {
        const paginationContainer = document.getElementById('paginationControls');
        if (!paginationContainer) {
            // Create pagination container if it doesn't exist
            const container = document.createElement('div');
            container.id = 'paginationControls';
            container.className = 'pagination-controls';
            
            const usersTableContainer = document.querySelector('.users-table-container');
            usersTableContainer.appendChild(container);
        }

        const paginationControls = document.getElementById('paginationControls');
        paginationControls.innerHTML = '';

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Anterior';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPageNumber = currentPage - 1;
                updateTable();
            }
        });

        // Page info
        const pageInfo = document.createElement('div');
        pageInfo.id = 'pageInfo';
        pageInfo.textContent = `Página ${currentPage} de ${totalPages} (${totalItems} usuários)`;

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.innerHTML = 'Próximo <i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPageNumber = currentPage + 1;
                updateTable();
            }
        });

        // Append controls
        paginationControls.appendChild(prevBtn);
        paginationControls.appendChild(pageInfo);
        paginationControls.appendChild(nextBtn);
    }

    // Edit user
    window.editUser = (id) => {
        const user = users.find(u => u.id === id);
        if (!user) return;
    
        editingUserId = id;
        document.getElementById('name').value = user.name;
        document.getElementById('name').disabled = true; // Disable name input
        document.getElementById('companyName').value = user.companyName || '';
        document.getElementById('email').value = user.email;
        document.getElementById('email').disabled = true; // Disable email input
        document.getElementById('password').value = user.password;
        document.getElementById('password').disabled = false; // Enable password input
        document.getElementById('phone').value = user.phone;

        if (user.role === 'user') {
          document.getElementById('cpf').value = user.cpf || '';
          document.getElementById('planExpiration').value = user.planExpiration || '';
        }

        toggleUserOnlyFields(user.role);
        document.querySelector('.modal-header h2').textContent = 'Editar Usuário';
        document.querySelector('.submit-btn').textContent = 'Atualizar'; // Change button text to 'Atualizar'
        userModal.style.display = 'block';
        initializePasswordToggle();
    };

  // Function to re-enable the name and email fields when adding a new user
  function enableNameAndEmailFields() {
    document.getElementById('name').disabled = false;
    document.getElementById('email').disabled = false;
  }

  // Call enableNameAndEmailFields when adding a new user
  addUserBtn.addEventListener('click', () => {
    userModal.style.display = 'block';
    userForm.reset();
    clearErrorMessages();
    document.querySelector('.modal-header h2').textContent = 'Adicionar Usuário';
    document.querySelector('.submit-btn').textContent = 'Salvar'; // Reset button text to 'Salvar'
    toggleUserOnlyFields('user');
    initializePasswordToggle(); // Reinitialize password toggle for new user
    enableNameAndEmailFields(); // Enable name and email fields
    editingUserId = null; // Reset editing state
  });

    // Delete user
    window.deleteUser = (id) => {
        const user = users.find(u => u.id === id);
        if (!user) {
            showAlertModal('Usuário não encontrado.', 'error');
            return;
        }

        showAlertModal('Tem certeza que deseja excluir este usuário?', 'warning', () => {
            // Get auth token from storage
            const token = getAuthToken();

            // Send delete request to the API
            fetch('https://n8n-n8n.ld9tly.easypanel.host/webhook/deleteuser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: user.name,
                    email: user.email
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.sucess === "sucess") {
                    showAlertModal('Usuário excluído com sucesso!', 'success');
                    users = users.filter(user => user.id !== id);
                    updateTable();
                } else {
                    showAlertModal('Erro ao excluir usuário. Resposta inesperada.', 'error');
                }
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                showAlertModal('Erro ao excluir usuário. Por favor, tente novamente.', 'error');
            });
        });
    };

  // Fetch user data from API
    async function fetchUsersData() {
        const token = getAuthToken();
        if (!token) {
            window.location.href = '../login/login.html';
            return;
        }

        try {
            const response = await fetch('https://n8n-n8n.ld9tly.easypanel.host/webhook/listuser', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            users = data.users; // Store fetched users
            updateTable(); // Update the table with fetched data

        } catch (error) {
            console.error('Error fetching user data:', error);
            showAlertModal('Erro ao buscar dados do usuário. Por favor, tente novamente.', 'error');
        }
    }

    // Initial table population
    fetchUsersData(); // Fetch data on page load
});

// Add date validation function
function validatePlanExpiration(date) {
    const selectedDate = new Date(date);
    const minDate = new Date('2024-01-01');
    const maxDate = new Date('2050-12-31');

    if (isNaN(selectedDate.getTime())) {
        return { valid: false, message: 'Data inválida' };
    }

    if (selectedDate < minDate) {
        return { valid: false, message: 'A data não pode ser anterior a 01/01/2024' };
    }

    if (selectedDate > maxDate) {
        return { valid: false, message: 'A data não pode ser posterior a 31/12/2050' };
    }

    return { valid: true };
}

// Add event listener to the form
document.getElementById('userForm').addEventListener('submit', function(e) {
    const planExpiration = document.getElementById('planExpiration').value;
    const dateValidation = validatePlanExpiration(planExpiration);

    if (!dateValidation.valid) {
        e.preventDefault();
        alert(dateValidation.message);
        return false;
    }
});
