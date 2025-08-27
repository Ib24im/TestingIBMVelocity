# Todo List App

A modern, feature-rich todo list application built with HTML, CSS, and JavaScript. This app provides a beautiful user interface with comprehensive task management capabilities.

## Features

### ✨ Core Functionality
- **Add todos** with text and categories
- **Mark todos as complete/incomplete** with visual feedback
- **Edit todos** with an intuitive modal interface
- **Delete todos** with confirmation prompts
- **Persistent storage** using localStorage

### 🎯 Advanced Features
- **Multiple categories** (Personal, Work, Shopping, Health, Other)
- **Smart filtering** by status (All, Active, Completed)
- **Category filtering** to focus on specific types of tasks
- **Real-time search** to quickly find specific todos
- **Statistics dashboard** showing total, active, and completed tasks
- **Bulk actions** (Clear completed, Clear all)
- **Responsive design** that works on all devices

### 🎨 User Experience
- **Modern UI** with smooth animations and transitions
- **Toast notifications** for user feedback
- **Keyboard shortcuts** for power users
- **Accessibility features** with proper ARIA labels
- **Dark theme** support through CSS custom properties

## How to Use

### Getting Started
1. Open `index.html` in your web browser
2. Start adding todos using the input field at the top
3. Select a category for each todo (optional)
4. Press Enter or click the "Add" button

### Managing Todos
- **Complete a todo**: Click the checkbox next to any todo
- **Edit a todo**: Click the edit icon (pencil) next to any todo
- **Delete a todo**: Click the delete icon (trash) next to any todo
- **Filter todos**: Use the filter buttons (All, Active, Completed)
- **Search todos**: Type in the search box to find specific todos
- **Filter by category**: Use the category dropdown to show specific types

### Keyboard Shortcuts
- **Ctrl/Cmd + Enter**: Add a new todo
- **Ctrl/Cmd + F**: Focus on search box
- **Escape**: Close modal dialog

### Bulk Actions
- **Clear Completed**: Remove all completed todos at once
- **Clear All**: Remove all todos (with confirmation)

## Technical Details

### Technologies Used
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with flexbox, grid, and animations
- **Vanilla JavaScript**: ES6+ features with class-based architecture
- **Font Awesome**: Icons for better visual hierarchy
- **Google Fonts**: Inter font family for clean typography

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Data Storage
All todos are automatically saved to your browser's localStorage, so your data persists between sessions. No server or database required!

### File Structure
```
/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles
├── script.js           # JavaScript functionality
└── README.md           # This documentation
```

## Customization

### Adding New Categories
To add new categories, update both the HTML select elements and the CSS category styles:

1. In `index.html`, add options to both category selects:
```html
<option value="newcategory">New Category</option>
```

2. In `styles.css`, add styling for the new category:
```css
.todo-category.newcategory { 
    background: #color; 
    color: #textcolor; 
}
```

### Modifying Colors
The app uses CSS custom properties for easy theming. Main colors can be changed by modifying the CSS variables or the gradient backgrounds.

### Extending Functionality
The `TodoApp` class is designed to be easily extensible. You can add new methods for additional features like:
- Due dates
- Priority levels
- Subtasks
- Tags
- Export/Import functionality

## Performance

- **Lightweight**: ~15KB total (HTML + CSS + JS)
- **Fast rendering**: Efficient DOM manipulation
- **Optimized animations**: CSS transforms and transitions
- **Memory efficient**: Minimal JavaScript footprint

## Security

- **XSS Protection**: All user input is properly escaped
- **No external dependencies**: Reduces security vulnerabilities
- **Client-side only**: No data sent to external servers

## Browser Storage

The app uses localStorage to save your todos. Each todo includes:
- Unique ID
- Text content
- Category
- Completion status
- Creation timestamp
- Completion timestamp (if completed)

## Future Enhancements

Potential features that could be added:
- [ ] Due dates and reminders
- [ ] Priority levels
- [ ] Subtasks and nested todos
- [ ] Drag and drop reordering
- [ ] Multiple todo lists/projects
- [ ] Cloud sync capabilities
- [ ] Collaboration features
- [ ] PWA (Progressive Web App) functionality
- [ ] Dark/light theme toggle
- [ ] Export to various formats (CSV, PDF)

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have suggestions for improvements, please feel free to reach out!

---

**Enjoy organizing your tasks with this modern todo list app!** 🚀
