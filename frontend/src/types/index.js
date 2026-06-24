/**
 * @typedef {Object} User
 * @property {number} id - Unique identifier for the user
 * @property {string} username - Display name of the user
 * @property {string} email - Email address of the user
 * @property {('admin'|'user')} role - Role of the user
 * @property {string} [createdAt] - ISO timestamp when the user was created
 */

/**
 * @typedef {Object} Document
 * @property {number} id - Unique identifier for the document
 * @property {string} title - Title of the document
 * @property {string} fileName - Original name of the uploaded PDF file
 * @property {string} filePath - Absolute path or reference to the uploaded PDF
 * @property {string} textContent - The parsed text extracted from the PDF
 * @property {number} [uploadedBy] - ID of the admin user who uploaded the document
 * @property {string} createdAt - ISO timestamp when the document was uploaded
 */

/**
 * @typedef {Object} ChatThread
 * @property {number|'new'} id - Unique identifier for the thread, or 'new' for drafts
 * @property {string} title - Automatic title summary of the thread
 * @property {number} userId - ID of the user owning this thread
 * @property {string} createdAt - ISO timestamp when the thread was created
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Message identifier
 * @property {string} query - The prompt query sent by the user
 * @property {string} response - The AI generated reply
 * @property {string} createdAt - ISO timestamp of when the message was sent
 */

/**
 * @typedef {Object} ChatLog
 * @property {number} id - Unique log entry identifier
 * @property {string} query - The user search query
 * @property {string} response - The AI response
 * @property {string} createdAt - ISO timestamp of activity
 * @property {User} [user] - The user object associated with the log
 * @property {ChatThread} [thread] - The chat thread associated with the log
 */

export {};
