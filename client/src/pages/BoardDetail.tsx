import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import { Trash2, Plus, Activity, Users } from "lucide-react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";

import { useThemeColors } from "../theme/useThemeColors";
import TaskCard from "../components/card/taskcard";

import { useAppDispatch, useAppSelector } from "../hooks/redux.hooks";
import {
  fetchBoardById,
  clearCurrentBoard,
  clearBoardErrors,
} from "../features/boards/boardSlice";
import { columnThunks } from "../features/columns/columnSlice";
import { cardThunks } from "../features/cards/cardSlice";
import type * as boardTypes from "../types/board.types";

import CreateTaskModal from "../components/modals/CreateTaskModal";
import ShareBoardModal from "../components/modals/ShareBoardModal";
import ActivitySidebar from "../components/modals/ActivitySidebar";
import MembersSidebar from "../components/modals/MemberSidebar";
import { useSocket } from "../hooks/useSocket";
import { fetchBoardLogs } from "../features/boards/boardSlice";

const BoardDetail = () => {
  const theme = useThemeColors();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId: string }>();

  const { user: currentUser } = useAppSelector((state) => state.auth); // Eğer yoksa ekle
  const { currentBoard, logs, isLoading, error } = useAppSelector(
    (state) => state.boards,
  );

  const isOwner =
    currentBoard && currentUser
      ? currentBoard.ownerId === currentUser.id
      : false;

  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColId, setActiveColId] = useState<string | null>(null);

  const [customToast, setCustomToast] = useState<{
    title: string;
    desc: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColTitle, setEditingColTitle] = useState("");

  const inviteLink = `${window.location.origin}/boards/${boardId}?invite=true`;

  useSocket(currentBoard?.id);

  useEffect(() => {
    if (boardId) dispatch(fetchBoardById(boardId));
    return () => {
      dispatch(clearCurrentBoard());
      dispatch(clearBoardErrors());
    };
  }, [boardId, dispatch]);

  useEffect(() => {
    if (isActivityOpen && currentBoard?.id) {
      dispatch(fetchBoardLogs(currentBoard.id));
    }
  }, [isActivityOpen, currentBoard?.id, dispatch]);

  const showToast = (
    title: string,
    desc: string,
    type: "success" | "info" | "error",
  ) => {
    setCustomToast({ title, desc, type });
    setTimeout(() => setCustomToast(null), 3000);
  };

  useEffect(() => {
    if (error === "sync_error" && currentBoard?.id) {
      setTimeout(() => {
        showToast("Hata", "Senkronizasyon sorunu. Pano yenileniyor...", "info");
      }, 0);

      dispatch(fetchBoardById(currentBoard.id));
      dispatch(clearBoardErrors());
    }
  }, [error, currentBoard?.id, dispatch]);
  const handleAddColumn = () => {
    if (newColumnTitle.trim() === "" || !currentBoard) return;
    dispatch(
      columnThunks.createColumn({
        boardId: currentBoard.id,
        title: newColumnTitle,
      }),
    );
    setNewColumnTitle("");
    setIsAddingColumn(false);
  };

  const handleDeleteColumn = (colId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this column?") ||
      !currentBoard
    )
      return;
    dispatch(
      columnThunks.deleteColumn({ boardId: currentBoard.id, columnId: colId }),
    );
  };

  const handleUpdateColumn = (colId: string) => {
    if (editingColTitle.trim() === "" || !currentBoard) {
      setEditingColId(null);
      return;
    }
    dispatch(
      columnThunks.updateColumn({
        boardId: currentBoard.id,
        columnId: colId,
        title: editingColTitle,
      }),
    );
    setEditingColId(null);
  };

  const openTaskModal = (colId: string) => {
    setActiveColId(colId);
    setIsModalOpen(true);
  };

  const onDragEnd = (result: DropResult) => {
    if (!currentBoard) return;
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    dispatch(
      cardThunks.moveCard({
        boardId: currentBoard.id,
        cardId: draggableId,
        fromColumnId: source.droppableId,
        toColumnId: destination.droppableId,
        newOrder: destination.index,
        newIndex: destination.index,
      }),
    );
  };

  if (isLoading)
    return (
      <Flex
        minH="100vh"
        align="center"
        justify="center"
        color={theme.textMuted}
        bg={theme.mainBg}
      >
        <Spinner size="xl" color="#c6d4f7" />
        <Text ml={4}>Board Loading...</Text>
      </Flex>
    );
  if (error || !currentBoard)
    return (
      <Flex
        minH="100vh"
        align="center"
        justify="center"
        direction="column"
        color={theme.textMuted}
        bg={theme.mainBg}
      >
        <Text mb={4}>{error || "Board is not found."}</Text>
        <Button
          onClick={() => navigate("/boards")}
          bg="#c6d4f7"
          color="#0c0e11"
        >
          Back to Boards
        </Button>
      </Flex>
    );

  return (
    <Box
      minH="100vh"
      bg={theme.mainBg}
      color={theme.textMain}
      p={{ base: 4, md: 8 }}
      fontFamily="'Inter', sans-serif"
      position="relative"
    >
      <Flex
        mb={10}
        justify="space-between"
        align="flex-start"
        direction={{ base: "column", lg: "row" }}
        gap={6}
      >
        <Heading
          fontFamily="'Manrope', sans-serif"
          fontSize="3xl"
          fontWeight="extrabold"
          color={theme.textMain}
          letterSpacing="tight"
        >
          {currentBoard.title}
        </Heading>
        <Flex gap={4} align="center">
          <Flex
            align="center"
            gap={3}
            mr={{ base: 0, md: 4 }}
            cursor="pointer"
            onClick={() => setIsMembersOpen(true)}
            _hover={{ opacity: 0.8 }}
          >
            <Users size={20} color={theme.textMuted} />
            <Text fontSize="sm" fontWeight="bold">
              Members ({currentBoard.members?.length || 0})
            </Text>
          </Flex>
          <Button
            size="sm"
            variant="solid"
            bg="#c6d4f7"
            color="#0c0e11"
            display="flex"
            gap={2}
            onClick={() => setIsShareModalOpen(true)}
          >
            Share
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor={theme.borderCol}
            color={theme.textMain}
            bg={theme.colBg}
            display="flex"
            gap={2}
            onClick={() => setIsActivityOpen(true)}
          >
            <Activity size={16} /> Activity
          </Button>
        </Flex>
      </Flex>

      <DragDropContext onDragEnd={onDragEnd}>
        <Flex gap={6} align="flex-start" overflowX="auto" pb={8}>
          {currentBoard.columns.map((col) => (
            <Flex
              key={col.id}
              direction="column"
              shrink={0}
              minW={{ base: "280px", md: "320px" }}
              maxW={{ base: "280px", md: "320px" }}
              bg={theme.colBg}
              p={{ base: 3, md: 4 }}
              borderRadius="md"
              border="1px solid"
              borderColor={theme.borderCol}
            >
              <Flex justify="space-between" align="center" mb={6} px={1}>
                <Flex align="center" gap={2} flex="1">
                  {editingColId === col.id ? (
                    <Input
                      value={editingColTitle}
                      onChange={(e) => setEditingColTitle(e.target.value)}
                      onBlur={() => handleUpdateColumn(col.id)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleUpdateColumn(col.id)
                      }
                      autoFocus
                      size="sm"
                      bg={theme.inputBg}
                      border="1px solid"
                      borderColor="#c6d4f7"
                      color={theme.textMain}
                    />
                  ) : (
                    <Heading
                      fontFamily="'Manrope', sans-serif"
                      fontSize="sm"
                      fontWeight="bold"
                      textTransform="uppercase"
                      cursor="pointer"
                      onDoubleClick={() => {
                        setEditingColId(col.id);
                        setEditingColTitle(col.title);
                      }}
                    >
                      {col.title}
                    </Heading>
                  )}
                  <Badge
                    bg={theme.isDark ? "#1b2027" : "#e2e8f0"}
                    color={theme.textMuted}
                    borderRadius="full"
                    px={2}
                  >
                    {col.card ? col.card.length : 0}
                  </Badge>
                </Flex>
                {isOwner && (
                  <Box
                    color={theme.textMuted}
                    cursor="pointer"
                    ml={2}
                    _hover={{ color: "red.400" }}
                    onClick={() => handleDeleteColumn(col.id)}
                  >
                    <Trash2 size={16} />
                  </Box>
                )}
              </Flex>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <Flex
                    direction="column"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    bg={
                      snapshot.isDraggingOver
                        ? theme.cardHoverBg
                        : "transparent"
                    }
                    transition="background-color 0.2s ease"
                    minH="100px"
                  >
                    {(col.card || []).map(
                      (card: boardTypes.Card, index: number) => (
                        <TaskCard
                          key={card.id}
                          index={index}
                          card={{
                            id: card.id,
                            title: card.title,
                            desc: card.content || "",
                            priority:
                              card.priority.charAt(0) +
                              card.priority.slice(1).toLowerCase(),
                            comments: card.comments ? card.comments.length : 0,
                          }}
                        />
                      ),
                    )}
                    {provided.placeholder}
                  </Flex>
                )}
              </Droppable>

              <Button
                w="full"
                py={5}
                mt={2}
                variant="ghost"
                color={theme.textMuted}
                border="1px dashed"
                borderColor={theme.borderCol}
                _hover={{ color: theme.textMain, bg: theme.cardHoverBg }}
                onClick={() => openTaskModal(col.id)}
                display="flex"
                gap={2}
              >
                <Plus size={16} /> ADD TASK
              </Button>
            </Flex>
          ))}

          <Flex
            shrink={0}
            minW={{ base: "280px", md: "320px" }}
            direction="column"
          >
            {isAddingColumn ? (
              <Box
                bg={theme.colBg}
                p={4}
                borderRadius="md"
                border="1px solid"
                borderColor={theme.borderCol}
              >
                <Input
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
                  placeholder="Sütun Başlığı"
                  autoFocus
                  size="sm"
                  bg={theme.inputBg}
                  border="1px solid"
                  borderColor={theme.borderCol}
                  color={theme.textMain}
                  mb={3}
                />
                <Flex gap={2}>
                  <Button
                    size="sm"
                    bg="#c6d4f7"
                    color="#0c0e11"
                    onClick={handleAddColumn}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    color={theme.textMuted}
                    onClick={() => setIsAddingColumn(false)}
                  >
                    Cancel
                  </Button>
                </Flex>
              </Box>
            ) : (
              <Button
                h="100px"
                variant="ghost"
                color={theme.textMuted}
                border="1px dashed"
                borderColor={theme.borderCol}
                _hover={{ color: theme.textMain, bg: theme.colBg }}
                onClick={() => setIsAddingColumn(true)}
                display="flex"
                gap={2}
              >
                <Plus size={18} /> NEW COLUMN
              </Button>
            )}
          </Flex>
        </Flex>
      </DragDropContext>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeColId={activeColId}
        boardId={currentBoard.id}
      />
      <ShareBoardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        inviteLink={inviteLink}
        showToast={showToast}
      />
      <ActivitySidebar
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        boardLogs={logs || []}
      />
      <MembersSidebar
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        boardMembers={currentBoard.members || []}
        boardId={currentBoard.id}
        ownerId={currentBoard.ownerId}
        showToast={showToast}
      />

      {customToast && (
        <Box
          position="fixed"
          bottom="24px"
          right="24px"
          bg={
            customToast.type === "success"
              ? "green.600"
              : customToast.type === "error"
                ? "red.600"
                : "#1b2027"
          }
          color="white"
          p={4}
          borderRadius="md"
          shadow="2xl"
          zIndex={10000}
        >
          <Text fontWeight="bold" fontSize="sm">
            {customToast.title}
          </Text>
          <Text fontSize="xs" mt={1} opacity={0.9}>
            {customToast.desc}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default BoardDetail;
