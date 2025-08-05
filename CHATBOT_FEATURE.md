# Chatbot Feature

## Overview

The chatbot feature provides an AI-powered assistant that uses ThoughtSpot's SpotterAgentEmbed to help users interact with their data models. The chatbot appears as a floating chat bubble in the bottom-right corner of the application.

## Features

### 1. Floating Chat Bubble
- Located in the bottom-right corner of the application
- Blue circular button with a chat icon
- Hover effects for better user experience
- Click to open the chatbot interface
- Uses configured colors from the application styling

### 2. Multi-Step Conversation Flow

#### Step 1: Initial Question
- User is prompted to describe what they want to ask about
- The system uses this information to fetch and filter relevant models

#### Step 2: Model Selection
- **Smart Filtering**: Only shows models that match the user's initial query
- Searches both model names and descriptions for matches
- If no matches found, shows all available models with a helpful message
- Users can select by:
  - Clicking on a model in the list
  - Typing a number (1, 2, 3, etc.)
  - Typing part of the model name
- Each model shows its name and description (if available)

#### Step 3: Chat Interface
- Once a model is selected, users can ask questions
- Uses SpotterAgentEmbed with the selected model's worksheetId
- Displays responses in a conversational format
- Supports multiple questions in a single session

### 3. User Experience Features

- **Auto-scroll**: Messages automatically scroll to the bottom
- **Loading states**: Shows "Thinking..." indicator during processing
- **Error handling**: Graceful error messages for failed requests
- **Reset functionality**: Users can reset the conversation to start over
- **Responsive design**: Chat window adapts to different screen sizes
- **Color customization**: Uses configured dialog colors from application settings

### 4. Smart Model Filtering

The chatbot intelligently filters models based on the user's initial query:

- **Name matching**: Searches for the query in model names
- **Description matching**: Searches for the query in model descriptions
- **Case-insensitive**: Matches are found regardless of case
- **Fallback behavior**: If no matches are found, shows all models with an explanation

Example:
- User asks: "banking"
- System finds models with "banking" in name or description
- Shows only relevant models to the user
- If no matches, shows all models with message: "I couldn't find any models matching 'banking'. Here are all available models:"

## Technical Implementation

### Components

1. **ChatBubble.tsx**: Floating button that triggers the chatbot
2. **Chatbot.tsx**: Main chatbot interface with conversation logic

### Key Technologies

- **SpotterAgentEmbed**: ThoughtSpot's AI agent for natural language queries
- **React Hooks**: State management for conversation flow
- **TypeScript**: Type safety for all components
- **Inline Styles**: Consistent with project's styling approach
- **Context API**: Uses app context for color configuration

### API Integration

- Uses `fetchModels()` from `thoughtspotApi.ts` to get available models
- Creates new SpotterAgentEmbed instances for each model selection
- Handles container responses from ThoughtSpot's API

### Color Configuration

The chatbot respects the application's color configuration:
- **Dialog background**: Uses `stylingConfig.application.dialogs.backgroundColor`
- **Dialog foreground**: Uses `stylingConfig.application.dialogs.foregroundColor`
- **Primary colors**: Uses consistent blue theme for buttons and user messages
- **Hover effects**: Smooth color transitions on interactive elements

## Usage

1. Click the blue chat bubble in the bottom-right corner
2. Describe what you want to ask about (e.g., "sales data", "customer information", "banking")
3. Select a model from the filtered list that appears
4. Ask your question in natural language
5. View the AI-generated response
6. Continue asking follow-up questions or reset to start over

## Configuration

The chatbot integrates with the existing ThoughtSpot configuration:
- Uses the same ThoughtSpot URL as the main application
- Respects user access controls and permissions
- Works with the existing authentication system
- Uses configured colors from the application styling settings

## Error Handling

- Network errors when fetching models
- Invalid model selections
- Empty or failed responses from SpotterAgentEmbed
- Session timeouts and authentication issues
- No matching models found (shows fallback with all models)

All errors are displayed to the user with helpful messages and recovery options. 