# User Access Control Feature

## Overview

The User Access Control feature allows you to create multiple users with different access permissions to the application. Each user can have access to specific standard menus and custom menus.

## Default Users

The application comes with two default users:

### Power User
- **Name**: Power User
- **Description**: Can access all features and content
- **Access**: All standard menus (Home, Favorites, My Reports, Spotter, Search, Full App)
- **Custom Menus**: All custom menus

### Basic User
- **Name**: Basic User
- **Description**: Limited access - cannot access Search and Full App
- **Access**: Home, Favorites, My Reports, Spotter
- **Restricted**: Search, Full App
- **Custom Menus**: All custom menus

## How to Use

### 1. User Selection
- Click on the user avatar in the top-right corner of the application
- Select a different user from the dropdown menu
- The navigation menu will automatically update to show only the menus the selected user can access

### 2. User Configuration
- Go to Settings → Users tab
- Here you can:
  - View all configured users
  - See which user is currently active
  - Add new users
  - Edit existing users
  - Delete users (at least one user must remain)
  - Configure access permissions for each user

### 3. Managing Users

#### Adding a New User
1. Click "Add New User" in the Users tab
2. Enter the user name and description
3. Configure access permissions:
   - **Standard Menus**: Check/uncheck the menus this user should have access to
   - **Custom Menus**: Check/uncheck the custom menus this user should have access to
4. Click "Create User"

#### Editing a User
1. Click "Edit" next to any user in the Users tab
2. Modify the user's name, description, or access permissions
3. Click "Save Changes"

#### Deleting a User
1. Click "Delete" next to any user in the Users tab
2. Confirm the deletion
3. Note: At least one user must remain in the system

### 4. Access Control

#### Standard Menus
- **Home**: Landing page of the application
- **Favorites**: User's favorite content
- **My Reports**: User's personal reports
- **Spotter**: AI-powered search interface
- **Search**: Traditional search interface
- **Full App**: Complete ThoughtSpot application

#### Custom Menus
- Custom menus created by administrators
- Access is controlled individually per user
- Users can only see custom menus they have been granted access to

## Technical Implementation

### Data Structure
```typescript
interface User {
  id: string;
  name: string;
  description?: string;
  access: UserAccess;
}

interface UserAccess {
  standardMenus: {
    home: boolean;
    favorites: boolean;
    "my-reports": boolean;
    spotter: boolean;
    search: boolean;
    "full-app": boolean;
  };
  customMenus: string[]; // Array of custom menu IDs
}

interface UserConfig {
  users: User[];
  currentUserId?: string;
}
```

### Storage
- User configuration is automatically saved to localStorage
- Configuration persists across browser sessions
- Default users are created automatically if no users exist

### Navigation Filtering
- The SideNav component automatically filters menus based on the current user's access permissions
- Only accessible menus are displayed in the navigation
- Menu order is preserved for accessible menus

## Configuration

### Default Configuration
The application includes default users that are created automatically:
- Power User with full access
- Basic User with limited access (no Search or Full App)

### Customization
- Users can modify the default users or create entirely new ones
- Access permissions can be fine-tuned for each user
- The system supports unlimited users (though UI may become crowded with many users)

## Security Notes

- This is a client-side access control system
- Access control is enforced in the UI only
- For production use, consider implementing server-side access control
- User configurations are stored in browser localStorage

## Future Enhancements

Potential improvements for the user access control system:
- Role-based access control (RBAC)
- Permission inheritance
- Time-based access restrictions
- Audit logging
- Server-side validation
- Integration with external identity providers 