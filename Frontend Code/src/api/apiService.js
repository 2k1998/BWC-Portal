// src/api/apiService.js

const BASE_URL = "http://127.0.0.1:8000";

/**
 * Generic function to make API calls to the backend.
 * @param {string} endpoint The API endpoint (e.g., "/token", "/users/me", "/tasks/").
 * @param {string} method The HTTP method (GET, POST, PUT, DELETE).
 * @param {object | URLSearchParams | null} data The request body data for POST/PUT, or null for GET/DELETE.
 * @param {string | null} token The authentication token, if required.
 * @returns {Promise<any>} The parsed JSON response or null for 204 No Content.
 * @throws {Error} If the API response is not OK.
 */
async function callApi(endpoint, method = 'GET', data = null, token = null) {
    const headers = {};
    const config = {
        method,
        headers,
    };

    // Set Authorization header if a token is provided
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Handle different content types for request body
    if (data) {
        if (endpoint === '/token' && method === 'POST') {
            const formData = new URLSearchParams();
            formData.append('username', data.username);
            formData.append('password', data.password);
            config.body = formData.toString();
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        } else {
            config.body = JSON.stringify(data);
            headers['Content-Type'] = 'application/json';
        }
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        let errorData = {};
        try {
            errorData = await response.json();
        } catch (e) {
            errorData.detail = response.statusText || 'An unknown error occurred.';
        }
        throw new Error(errorData.detail || `API error: ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

// --- Authentication API calls ---
export const authApi = {
    /**
     * Registers a new user.
     * @param {object} userData - { email, password, full_name, birthday }
     */
    register: (userData) => callApi('/register', 'POST', userData),

    /**
     * Logs in a user and retrieves an access token.
     * @param {string} username - User's email (FastAPI expects 'username' for OAuth2PasswordRequestForm).
     * @param {string} password - User's password.
     */
    login: (username, password) => callApi('/token', 'POST', { username, password }),

    /**
     * Retrieves details of the current authenticated user.
     * @param {string} token - The access token.
     */
    getMe: (token) => callApi('/users/me', 'GET', null, token),

    /**
     * Updates the current authenticated user's profile.
     * @param {object} userData - { full_name, birthday }
     * @param {string} token - The access token.
     */
    updateUserMe: (userData, token) => callApi('/users/me', 'PUT', userData, token),

    /**
     * Retrieves a list of all users. Admin only.
     * @param {string} token - The access token.
     * @param {string} search - Optional search query for email or full name.
     */
    listAllUsers: (token, search = '') => {
        const queryString = search ? `?search=${encodeURIComponent(search)}` : '';
        return callApi(`/users/all${queryString}`, 'GET', null, token);
    },

    /**
     * Retrieves a single user by ID. Admin only.
     * @param {number} userId - The ID of the user to retrieve.
     * @param {string} token - The access token.
     */
    getUserById: (userId, token) => callApi(`/users/${userId}`, 'GET', null, token), // <--- NEW API CALL

    /**
     * Updates a user's role. Admin only.
     * @param {number} userId - The ID of the user to update.
     * @param {object} roleData - { role: string }
     * @param {string} token - The access token.
     */
    updateUserRole: (userId, roleData, token) => callApi(`/users/${userId}/role`, 'PUT', roleData, token), // <--- NEW API CALL

    /**
     * Toggles a user's active status. Admin only.
     * @param {number} userId - The ID of the user to update.
     * @param {object} statusData - { is_active: bool }
     * @param {string} token - The access token.
     */
    updateUserStatus: (userId, statusData, token) => callApi(`/users/${userId}/status`, 'PUT', statusData, token), // <--- NEW API CALL

    /**
     * Deletes a user. Admin only.
     * @param {number} userId - The ID of the user to delete.
     * @param {string} token - The access token.
     */
    deleteUser: (userId, token) => callApi(`/users/${userId}`, 'DELETE', null, token), // <--- NEW API CALL

    /**
     * Requests a password reset link for a given email.
     * @param {object} data - { email: string }
     */
    requestPasswordReset: (data) => callApi('/auth/request-password-reset', 'POST', data), // <--- ADD THIS NEW API CALL
};

// --- Task Management API calls ---
export const taskApi = {
    /**
     * Creates a new task.
     * @param {object} taskData - { title, description, deadline, urgency, important, completed }
     * @param {string} token - The access token.
     */
    createTask: (taskData, token) => callApi('/tasks/', 'POST', taskData, token),

    /**
     * Retrieves all tasks for the current authenticated user.
     * @param {string} token - The access token.
     */
    getTasks: (token) => callApi('/tasks/', 'GET', null, token),

    /**
     * Retrieves a specific task by its ID.
     * @param {number} taskId - The ID of the task.
     * @param {string} token - The access token.
     */
    getTaskById: (taskId, token) => callApi(`/tasks/${taskId}`, 'GET', null, token),

    /**
     * Updates an existing task.
     * @param {number} taskId - The ID of the task to update.
     * @param {object} taskData - The fields to update (e.g., { title, description, status, completed }).
     * @param {string} token - The access token.
     */
    updateTask: (taskId, taskData, token) => callApi(`/tasks/${taskId}`, 'PUT', taskData, token),

    /**
     * Deletes a task.
     * @param {number} taskId - The ID of the task to delete.
     * @param {string} token - The access token.
     */
    deleteTask: (taskId, token) => callApi(`/tasks/${taskId}`, 'DELETE', null, token),
};

// --- Group Management API calls ---
export const groupApi = {
    /**
     * Retrieves all available groups.
     * @param {string} token - The access token.
     */
    getGroups: (token) => callApi('/groups/', 'GET', null, token),

    /**
     * Creates a new group.
     * @param {object} groupData - { name }
     * @param {string} token - The access token.
     */
    createGroup: (groupData, token) => callApi('/groups/', 'POST', groupData, token),

    /**
     * Adds a user to a specific group.
     * @param {number} groupId - The ID of the group.
     * @param {number} userId - The ID of the user to add.
     * @param {string} token - The access token.
     */
    addUserToGroup: (groupId, userId, token) => callApi(`/groups/${groupId}/add-user/${userId}`, 'POST', null, token),

    /**
     * Retrieves all members of a specific group.
     * @param {number} groupId - The ID of the group.
     * @param {string} token - The access token.
     */
    getGroupMembers: (groupId, token) => callApi(`/groups/${groupId}/members`, 'GET', null, token),

    /**
     * Assigns a new task to a specific group.
     * @param {number} groupId - The ID of the group.
     * @param {object} taskData - { title, description, deadline, urgency, important }
     * @param {string} token - The access token.
     */
    assignGroupTask: (groupId, taskData, token) => callApi(`/groups/${groupId}/assign-task`, 'POST', taskData, token),

    /**
     * Retrieves all tasks assigned to a specific group.
     * @param {number} groupId - The ID of the group.
     * @param {string} token - The access token.
     */
    getGroupTasks: (groupId, token) => callApi(`/groups/${groupId}/tasks`, 'GET', null, token),

    /**
     * Deletes a group.
     * @param {number} groupId - The ID of the group to delete.
     * @param {string} token - The access token.
     */
    deleteGroup: (groupId, token) => callApi(`/groups/${groupId}`, 'DELETE', null, token),

    /**
     * Removes a user from a specific group.
     * @param {number} groupId - The ID of the group.
     * @param {number} userId - The ID of the user to remove.
     * @param {string} token - The access token.
     */
    removeUserFromGroup: (groupId, userId, token) => callApi(`/groups/${groupId}/remove-user/${userId}`, 'DELETE', null, token),

    /**
     * Retrieves details of a specific group by its ID.
     * @param {number} groupId - The ID of the group.
     * @param {string} token - The access token.
     */
    getGroupById: (groupId, token) => callApi(`/groups/${groupId}`, 'GET', null, token),
};

// --- Calendar API calls ---
export const calendarApi = {
    /**
     * Retrieves calendar events (birthdays, task deadlines) for the current user.
     * Role-based: admin sees all, regular user sees own/group-assigned.
     * @param {string} token - The access token.
     * @param {object} params - Optional date filters { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }.
     */
    getCalendarEvents: (token, params = {}) => {
        const queryString = new URLSearchParams();
        if (params.start_date) queryString.append('start_date', params.start_date);
        if (params.end_date) queryString.append('end_date', params.end_date);
        const query = queryString.toString() ? `?${queryString.toString()}` : '';
        return callApi(`/calendar/events${query}`, 'GET', null, token);
    },
};

// --- Company Management API calls ---
export const companyApi = {
    /**
     * Creates a new company.
     * @param {object} companyData - { name, vat_number, occupation, creation_date, description }
     * @param {string} token - The access token.
     */
    create: (companyData, token) => callApi('/companies/', 'POST', companyData, token),

    /**
     * Retrieves all companies for the current authenticated user.
     * @param {string} token - The access token.
     */
    getAll: (token) => callApi('/companies/', 'GET', null, token),

    /**
     * Retrieves a specific company by its ID.
     * @param {number} companyId - The ID of the company.
     * @param {string} token - The access token.
     */
    getById: (companyId, token) => callApi(`/companies/${companyId}`, 'GET', null, token),

    /**
     * Updates an existing company.
     * @param {number} companyId - The ID of the company to update.
     * @param {object} companyData - The fields to update.
     * @param {string} token - The access token.
     */
    update: (companyId, companyData, token) => callApi(`/companies/${companyId}`, 'PUT', companyData, token),

    /**
     * Deletes a company.
     * @param {number} companyId - The ID of the company to delete.
     * @param {string} token - The access token.
     */
    delete: (companyId, token) => callApi(`/companies/${companyId}`, 'DELETE', null, token),

    /**
     * Retrieves all tasks for a specific company.
     * @param {number} companyId - The ID of the company.
     * @param {string} token - The access token.
     */
    getCompanyTasks: (companyId, token) => callApi(`/companies/${companyId}/tasks`, 'GET', null, token),
};

// --- NEW: Event Management API calls ---
export const eventApi = {
    /**
     * Creates a new event. Admin only.
     * @param {object} eventData - { title, description, location, event_date }
     * @param {string} token - The access token.
     */
    createEvent: (eventData, token) => callApi('/events/', 'POST', eventData, token),

    /**
     * Retrieves the single next upcoming event.
     * @param {string} token - The access token.
     */
    getUpcomingEvent: (token) => callApi('/events/upcoming', 'GET', null, token),

    /**
     * --- NEW: Retrieves a list of all events. ---
     * @param {string} token - The access token.
     */
    getAllEvents: (token) => callApi('/events/', 'GET', null, token),

    /**
     * --- NEW: Deletes an event by its ID. Admin only. ---
     * @param {number} eventId - The ID of the event to delete.
     * @param {string} token - The access token.
     */
    deleteEvent: (eventId, token) => callApi(`/events/${eventId}`, 'DELETE', null, token),
};
