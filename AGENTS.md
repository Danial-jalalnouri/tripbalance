# AGENTS.md - AI Agent Instructions for Trip Balance

## Project Overview

Trip Balance is a travel expense tracking web application. All data is currently stored in localStorage with plans for future Firestore/Firebase integration.

## Critical Rules

### 1. File Separation (MANDATORY)

**ALWAYS keep HTML, CSS, and JavaScript in separate files.**

- `index.html` - Structure and markup only
- `styles.css` - All styling and visual design
- `app.js` - All application logic and data management

**NEVER:**
- Put CSS in `<style>` tags in HTML
- Put JavaScript in `<script>` tags in HTML
- Inline styles in HTML elements (except for dynamic notifications in JS)
- Mix concerns in any single file

### 2. README Updates (MANDATORY)

**ALWAYS update the README.md when making changes to the project.**

When you modify any part of the project:
- Update the Features section if adding new features
- Update the File Descriptions if modifying file structure
- Update the Usage section if changing how the app works
- Add any new dependencies or requirements

### 3. Code Architecture

The project uses a modular architecture:

- **DataStore**: Handles all data persistence (currently localStorage)
- **CurrencyUtils**: Currency formatting and management
- **CategoryUtils**: Category information and organization
- **UI**: DOM manipulation and event handling

When adding features:
- Keep data logic in DataStore
- Keep UI rendering in UI controller
- Use utility functions for formatting and calculations

### 4. Future Firestore Integration

The DataStore object is designed to be easily replaceable with Firestore:

```javascript
// Current: localStorage
DataStore.getExpenses() {
    const data = localStorage.getItem(this.EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
}

// Future: Firestore
DataStore.getExpenses() {
    const snapshot = await db.collection('expenses').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

When implementing Firestore:
1. Create a separate `firebase-config.js` file
2. Update DataStore methods to use Firestore
3. Update README with Firebase setup instructions
4. Keep the same DataStore interface for consistency

### 5. Code Style

- Use modern JavaScript (ES6+)
- Use semantic HTML5 elements
- Follow BEM-like naming for CSS classes
- Keep functions small and focused
- Add comments only when necessary for complex logic

### 6. Testing

Before completing any changes:
1. Verify HTML is valid and semantic
2. Check CSS for syntax errors
3. Test JavaScript in browser console
4. Ensure responsive design works on mobile
5. Verify localStorage operations work correctly

## File Responsibilities

### index.html
- Page structure and layout
- Form elements for data input
- Display containers for dynamic content
- Links to external CSS and JS files

### styles.css
- CSS variables for theming
- Responsive design (mobile-first)
- Component styling (cards, forms, buttons)
- Animations and transitions
- Category color coding

### app.js
- DataStore abstraction (localStorage now, Firestore later)
- Event listeners and handlers
- DOM manipulation
- Data filtering and sorting
- CSV export functionality
- Notification system

## Common Tasks

### Adding a New Feature
1. Add HTML structure to index.html
2. Add CSS styling to styles.css
3. Add JavaScript logic to app.js
4. Update README.md with new feature description

### Adding a New Currency
1. Add currency option to HTML select elements
2. Add currency symbol to CurrencyUtils.symbols
3. Update filter options in HTML

### Adding a New Category
1. Add category option to HTML select elements
2. Add category info to CategoryUtils.categories
3. Add category CSS class for color
4. Update filter options in HTML

### Modifying Data Structure
1. Update DataStore methods
2. Update UI rendering functions
3. Update CSV export fields
4. Document changes in README

## Quality Checklist

Before completing any task:
- [ ] HTML, CSS, and JS are in separate files
- [ ] README.md is updated with changes
- [ ] Code follows existing patterns
- [ ] Responsive design works
- [ ] No console errors
- [ ] localStorage operations work
- [ ] Filters work correctly
- [ ] Export functionality works

## Notes

- Always maintain backward compatibility with existing data
- Keep the DataStore interface consistent for future Firestore migration
- Test on multiple screen sizes
- Ensure accessibility (labels, semantic HTML, keyboard navigation)
