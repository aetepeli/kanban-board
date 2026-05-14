import { useState } from "react";
import {
  Flex,
  Box,
  Heading,
  Text,
  Input,
  Textarea,
  Button,
} from "@chakra-ui/react";
import { useThemeColors } from "../../theme/useThemeColors";
import { useAppDispatch } from "../../hooks/redux.hooks";
import { cardThunks } from "../../features/cards/cardSlice";
import { fetchBoardById } from "../../features/boards/boardSlice";
import type * as cardTypes from "../../types/card.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeColId: string | null;
  boardId: string;
}

const CreateTaskModal = ({ isOpen, onClose, activeColId, boardId }: Props) => {
  const theme = useThemeColors();
  const dispatch = useAppDispatch();

  const [newTaskForm, setNewTaskForm] = useState<{
    title: string;
    content: string;
    priority: cardTypes.CardPriority;
  }>({
    title: "",
    content: "",
    priority: "LOW",
  });

  if (!isOpen) return null;

  const handleCreateTask = () => {
    if (newTaskForm.title.trim() === "" || !activeColId) return;

    dispatch(
      cardThunks.createCard({
        boardId,
        columnId: activeColId,
        title: newTaskForm.title,
        content: newTaskForm.content,
        priority: newTaskForm.priority,
      }),
    ).then(() => dispatch(fetchBoardById(boardId)));

    setNewTaskForm({ title: "", content: "", priority: "LOW" });
    onClose();
  };

  return (
    <Flex
      position="fixed"
      top="0"
      left="0"
      w="100vw"
      h="100vh"
      bg={theme.modalOverlay}
      backdropFilter="blur(5px)"
      zIndex="9999"
      align="center"
      justify="center"
      p={4}
      onClick={onClose}
    >
      <Box
        bg={theme.cardBg}
        w="100%"
        maxW="500px"
        p={8}
        borderRadius="md"
        border="1px solid"
        borderColor={theme.borderCol}
        shadow="2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Heading
          fontFamily="'Manrope', sans-serif"
          fontSize="xl"
          mb={6}
          color={theme.textMain}
        >
          Create New Task
        </Heading>
        <Box mb={4}>
          <Text fontSize="xs" fontWeight="bold" color={theme.textMuted} mb={2}>
            Task Title
          </Text>
          <Input
            value={newTaskForm.title}
            onChange={(e) =>
              setNewTaskForm({ ...newTaskForm, title: e.target.value })
            }
            bg={theme.inputBg}
            color={theme.textMain}
            border="1px solid"
            borderColor={theme.borderCol}
            _focus={{ borderColor: "#c6d4f7", outline: "none" }}
          />
        </Box>
        <Box mb={6}>
          <Text fontSize="xs" fontWeight="bold" color={theme.textMuted} mb={2}>
            Description
          </Text>
          <Textarea
            value={newTaskForm.content}
            onChange={(e) =>
              setNewTaskForm({ ...newTaskForm, content: e.target.value })
            }
            bg={theme.inputBg}
            color={theme.textMain}
            border="1px solid"
            borderColor={theme.borderCol}
            rows={3}
            _focus={{ borderColor: "#c6d4f7", outline: "none" }}
          />
        </Box>
        <Box mb={8}>
          <Text fontSize="xs" fontWeight="bold" color={theme.textMuted} mb={2}>
            Priority
          </Text>
          <Flex gap={2}>
            {(["HIGH", "MEDIUM", "LOW", "URGENT"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                flex="1"
                bg={
                  newTaskForm.priority === p
                    ? theme.isDark
                      ? "#20262e"
                      : "#e2e8f0"
                    : theme.inputBg
                }
                color={
                  newTaskForm.priority === p ? theme.textMain : theme.textMuted
                }
                border="1px solid"
                borderColor={
                  newTaskForm.priority === p ? "#c6d4f7" : theme.borderCol
                }
                onClick={() => setNewTaskForm({ ...newTaskForm, priority: p })}
              >
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </Button>
            ))}
          </Flex>
        </Box>
        <Flex justify="flex-end" gap={3}>
          <Button variant="ghost" color={theme.textMuted} onClick={onClose}>
            Cancel
          </Button>
          <Button bg="#c6d4f7" color="#0c0e11" onClick={handleCreateTask}>
            Create
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};

export default CreateTaskModal;
