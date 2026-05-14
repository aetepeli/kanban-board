import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Flex,
  Heading,
  Text,
  Textarea,
  Button,
  Spinner,
  Center,
  Avatar,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  AlignLeft,
  MessageSquare,
  Calendar,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import { useThemeColors } from "../theme/useThemeColors";
import type { RootState, AppDispatch } from "../store";
import { cardThunks } from "../features/cards/cardSlice";
import { commentThunks } from "../features/comments/commentSlice";
import * as cardTypes from "../types/card.types";

interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface ExtendedCard extends cardTypes.Card {
  column?: {
    boardId: string;
    title: string;
    board?: { ownerId: string };
  };
  comments?: TaskComment[];
  assignee?: {
    id: string;
    fullName: string;
    email: string;
  };
}

const CardDetail = () => {
  const { cardId } = useParams<{ cardId: string }>();

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useThemeColors();

  // DİKKAT: state.boards (currentBoard) useSelector'ı TAMAMEN SİLİNDİ
  const { isLoading, currentCard } = useSelector(
    (state: RootState) => state.cards,
  );
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  const task = currentCard as unknown as ExtendedCard;
  const boardId = task?.column?.boardId;

  // YENİ isOwner MANTIĞI: Veriyi doğrudan task'ın içinden (backend'den) alıyoruz
  const isOwner =
    currentUser && task?.column?.board?.ownerId === currentUser.id;

  const [newComment, setNewComment] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const dangerBg = theme.isDark ? "#7f292720" : "#fed7d7";
  const dangerText = theme.isDark ? "#ff9993" : "#c53030";

  const formatCommentDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  useEffect(() => {
    if (cardId) {
      dispatch(cardThunks.fetchCardById(cardId));
    }
  }, [cardId, dispatch]);

  if (isLoading) {
    return (
      <Center minH="100vh">
        <Spinner color="#c6d4f7" size="xl" />
      </Center>
    );
  }

  if (!task) {
    return (
      <Center minH="100vh">
        <Text color={theme.textMain}>Kart bulunamadı.</Text>
      </Center>
    );
  }

  const handleAddComment = async () => {
    if (newComment.trim() === "" || !cardId || !boardId || !task.columnId)
      return;

    try {
      await dispatch(
        commentThunks.createComment({
          cardId,
          boardId,
          columnId: task.columnId,
          content: newComment,
        }),
      ).unwrap();

      setNewComment("");
    } catch (err) {
      console.error("Yorum ekleme hatası:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!cardId || !task.columnId || !boardId) return;

    setIsDeleting(true);
    try {
      await dispatch(
        cardThunks.deleteCard({
          cardId,
          columnId: task.columnId,
          boardId,
        }),
      ).unwrap();

      setIsDeleteModalOpen(false);
      navigate(`/boards/${boardId}`);
    } catch (err) {
      console.error("Silme hatası:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box
      minH="100vh"
      color={theme.textMain}
      p={8}
      fontFamily="'Inter', sans-serif"
      transition="color 0.3s"
      position="relative"
    >
      <Flex
        maxW="1000px"
        mx="auto"
        gap={8}
        direction={{ base: "column", md: "row" }}
      >
        <Box>
          <Button
            variant="ghost"
            color={theme.textMuted}
            p={0}
            _hover={{ color: theme.textMain, bg: "transparent" }}
            onClick={() => {
              if (boardId) navigate(`/boards/${boardId}`);
              else navigate(-1);
            }}
            display="flex"
            alignItems="center"
            gap={2}
          >
            <ArrowLeft size={16} /> Panoya Dön
          </Button>
        </Box>

        <Box flex="2" display="flex" flexDirection="column" gap={8}>
          <Box>
            <Text
              color={theme.textMuted}
              fontSize="sm"
              fontWeight="medium"
              mb={2}
            >
              {task.id.substring(0, 8)} <span style={{ opacity: 0.3 }}>/</span>{" "}
              {task.priority}
            </Text>
            <Heading
              fontSize="2xl"
              fontWeight="extrabold"
              fontFamily="'Manrope', sans-serif"
              color={theme.textMain}
              mb={4}
            >
              {task.title}
            </Heading>
            <Flex gap={3} align="center">
              <Box
                bg={theme.isDark ? "#1b2027" : "#e2e8f0"}
                color={theme.isDark ? "#c6d4f7" : "#3182ce"}
                px={3}
                py={1}
                borderRadius="sm"
                fontSize="xs"
                fontWeight="bold"
              >
                GÖREV
              </Box>
              <Box
                bg={
                  task.priority === "HIGH" || task.priority === "URGENT"
                    ? dangerBg
                    : "#e2e8f0"
                }
                color={
                  task.priority === "HIGH" || task.priority === "URGENT"
                    ? dangerText
                    : "#4a5568"
                }
                px={3}
                py={1}
                borderRadius="sm"
                fontSize="xs"
                fontWeight="bold"
              >
                ÖNCELİK: {task.priority}
              </Box>
            </Flex>
          </Box>

          <Box>
            <Heading
              fontSize="lg"
              fontFamily="'Manrope', sans-serif"
              mb={3}
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Box color="#c6d4f7">
                <AlignLeft size={20} />
              </Box>{" "}
              Açıklama
            </Heading>
            <Box
              bg={theme.cardBg}
              p={5}
              borderRadius="md"
              border="1px solid"
              borderColor={theme.borderCol}
            >
              <Text color={theme.textMuted} fontSize="sm" lineHeight="tall">
                {task.content || "Bu görev için bir açıklama girilmemiş."}
              </Text>
            </Box>
          </Box>

          <Box>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading
                fontSize="lg"
                fontFamily="'Manrope', sans-serif"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Box color="#c6d4f7">
                  <MessageSquare size={20} />
                </Box>{" "}
                Yorumlar
              </Heading>
            </Flex>

            {/* YORUMLAR LİSTESİ */}
            <Flex direction="column" gap={4} mb={6}>
              {task.comments?.map((comment: TaskComment) => (
                <Flex
                  key={comment.id}
                  gap={4}
                  p={4}
                  bg={theme.commentBg || theme.cardBg}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={theme.borderCol}
                >
                  {/* SOL TARAF: Avatar */}
                  <Avatar.Root size="sm">
                    <Avatar.Fallback
                      name={comment.user?.fullName || "Bilinmeyen Kullanıcı"}
                      bg={theme.isDark ? "#2d3748" : "#e2e8f0"}
                      color={theme.isDark ? "#c6d4f7" : "#2b6cb0"}
                    />
                  </Avatar.Root>

                  {/* SAĞ TARAF: İçerik */}
                  <Box flex="1">
                    {/* Üst Satır: İsim ve Tarih */}
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color={theme.textMain}
                      >
                        {comment.user?.fullName || "Bilinmeyen Kullanıcı"}
                      </Text>
                      <Text fontSize="xs" color={theme.textMuted}>
                        {formatCommentDate(comment.createdAt)}
                      </Text>
                    </Flex>

                    {/* Alt Satır: Yorum Metni */}
                    <Text
                      fontSize="sm"
                      color={theme.textMuted}
                      whiteSpace="pre-wrap"
                    >
                      {comment.content}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Flex>

            <Flex
              gap={4}
              p={4}
              bg={theme.cardBg}
              borderRadius="md"
              border="1px solid"
              borderColor={theme.borderCol}
            >
              <Box flex="1">
                <Textarea
                  placeholder="Yorum yaz..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  bg="transparent"
                  border="none"
                  fontSize="sm"
                  color={theme.textMain}
                  resize="none"
                  _focus={{ ring: 0 }}
                />
                <Flex justify="flex-end" mt={2}>
                  <Button
                    size="sm"
                    bg="#c6d4f7"
                    color="#0c0e11"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Gönder
                  </Button>
                </Flex>
              </Box>
            </Flex>
          </Box>
        </Box>

        <Box flex="1">
          <Box
            bg={theme.cardBg}
            p={6}
            borderRadius="md"
            border="1px solid"
            borderColor={theme.borderCol}
            display="flex"
            flexDirection="column"
            gap={6}
          >
            <Box>
              <Text
                fontSize="10px"
                fontWeight="bold"
                color={theme.textMuted}
                textTransform="uppercase"
                mb={2}
              >
                Sorumlu
              </Text>
              <Text fontSize="sm" fontWeight="medium" color={theme.textMain}>
                {task.assigneeId ? "Atanmış Kullanıcı" : "Atanmadı"}
              </Text>
            </Box>

            <Box>
              <Text
                fontSize="10px"
                fontWeight="bold"
                color={theme.textMuted}
                textTransform="uppercase"
                mb={2}
              >
                Teslim Tarihi
              </Text>
              <Flex align="center" gap={3}>
                <Calendar size={16} color="#c6d4f7" />
                <Text fontSize="sm" color={theme.textMain}>
                  {task.deadline
                    ? new Date(task.deadline).toLocaleDateString()
                    : "Tarih Belirtilmedi"}
                </Text>
              </Flex>
            </Box>

            <Box pt={4} borderTop="1px solid" borderColor={theme.borderCol}>
              {isOwner && (
                <Button
                  w="full"
                  variant="ghost"
                  color={dangerText}
                  _hover={{ bg: dangerBg }}
                  justifyContent="flex-start"
                  fontSize="sm"
                  display="flex"
                  alignItems="center"
                  gap={2}
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <Trash2 size={16} /> Delete Task
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Flex>

      {isDeleteModalOpen && (
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
        >
          <Box
            bg={theme.cardBg}
            w="100%"
            maxW="400px"
            p={8}
            borderRadius="xl"
            border="1px solid"
            borderColor={theme.borderCol}
            textAlign="center"
          >
            <Flex
              w="64px"
              h="64px"
              mx="auto"
              bg={dangerBg}
              color={dangerText}
              borderRadius="full"
              align="center"
              justify="center"
              mb={6}
            >
              <AlertTriangle size={32} />
            </Flex>
            <Heading fontSize="xl" mb={3} color={theme.textMain}>
              Görevi Sil
            </Heading>
            <Text color={theme.textMuted} fontSize="sm" mb={8}>
              Bu işlem geri alınamaz.
            </Text>
            <Flex gap={3}>
              <Button
                flex="1"
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                İptal
              </Button>
              <Button
                flex="1"
                bg={dangerText}
                color="white"
                onClick={handleDeleteConfirm}
                loading={isDeleting}
              >
                Sil
              </Button>
            </Flex>
          </Box>
        </Flex>
      )}
    </Box>
  );
};

export default CardDetail;
