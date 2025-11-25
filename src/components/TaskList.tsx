import React, { useState, useCallback } from "react";
import { Box, Text, useInput, useApp } from "ink";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  header?: string;
}

interface TaskListProps {
  tasks: Task[];
  title?: string;
  notePath?: string;
  onExit?: () => void;
  onTaskToggle?: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks: initialTasks,
  title,
  notePath,
  onExit,
  onTaskToggle,
}) => {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { exit } = useApp();

  // Group tasks by header
  const groupedTasks = React.useMemo(() => {
    const groups: { [header: string]: Task[] } = {};
    tasks.forEach(task => {
      const header = task.header || 'General';
      if (!groups[header]) {
        groups[header] = [];
      }
      groups[header].push(task);
    });
    return groups;
  }, [tasks]);

  // Handle keyboard input
  useInput((input, key) => {
    if (input === "q" || key.escape || (key.ctrl && input === "c")) {
      if (onExit) {
        onExit();
      } else {
        exit();
      }
      return;
    }

    if (key.upArrow || input === "k") {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow || input === "j") {
      setSelectedIndex((prev) => Math.min(tasks.length - 1, prev + 1));
    } else if (key.return || input === " ") {
      // Toggle the selected task
      if (tasks[selectedIndex]) {
        const taskId = tasks[selectedIndex].id;

        // Update local state immediately for real-time UI update
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId
              ? { ...task, completed: !task.completed }
              : task
          )
        );

        // Call callback for persistence
        if (onTaskToggle) {
          onTaskToggle(taskId);
        }
      }
    } else if (input === "g") {
      setSelectedIndex(0);
    } else if (input === "G") {
      setSelectedIndex(Math.max(0, tasks.length - 1));
    }
  });

  const renderTask = useCallback((task: Task, globalIndex: number) => {
    const isSelected = globalIndex === selectedIndex;
    const checkbox = task.completed ? "✓" : " ";
    const statusColor = task.completed ? "green" : "red";

    return (
      <Box key={task.id} marginLeft={2} marginBottom={1}>
        <Text color={isSelected ? "cyan" : "white"}>
          {isSelected ? "→ " : "  "}
        </Text>
        <Text color={statusColor}>
          [{checkbox}]
        </Text>
        <Text color={task.completed ? "gray" : "white"} dimColor={task.completed}>
          {" "}
          {task.text}
        </Text>
      </Box>
    );
  }, [selectedIndex]);

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  return (
    <Box flexDirection="column" height="100%">
      {title && (
        <Box marginBottom={1}>
          <Text color="blue" bold underline>
            {title}
            {notePath && (
              <Text color="gray" dimColor>
                {" "}
                - Tasks from {notePath.split('/').pop()}
              </Text>
            )}
          </Text>
        </Box>
      )}

      <Box marginBottom={1}>
        <Text color="yellow">
          Progress: {completedCount}/{totalCount} tasks completed
        </Text>
      </Box>

      <Box flexDirection="column" flexGrow={1}>
        {tasks.length === 0 ? (
          <Text color="gray" dimColor>
            No tasks found in this note.
          </Text>
        ) : (
          Object.entries(groupedTasks).map(([header, groupTasks]) => (
            <Box key={header} flexDirection="column" marginBottom={1}>
              <Box marginBottom={1}>
                <Text color="yellow" bold>
                  {header}
                </Text>
              </Box>
              {groupTasks.map((task) => renderTask(task, tasks.indexOf(task)))}
            </Box>
          ))
        )}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {tasks.length > 0 && `↑↓/j/k: navigate | Space/Enter: toggle | `}
          g/G: top/bottom | q/ESC: exit
        </Text>
      </Box>
    </Box>
  );
};

export default TaskList;