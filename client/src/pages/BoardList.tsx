import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  Input,
  Button,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import {
  LayoutDashboard,
  Plus,
  FolderKanban,
  Clock,
  ChevronRight,
  Trash2,
} from "lucide-react";

import { useThemeColors } from "../theme/useThemeColors";
import { useAppDispatch, useAppSelector } from "../hooks/redux.hooks";

import {
  fetchBoards,
  createBoard,
  deleteBoard,
} from "../features/boards/boardSlice";

const BoardList = () => {
  const navigate = useNavigate();
  const theme = useThemeColors();
  const dispatch = useAppDispatch();

  const {
    boards = [],
    isLoading,
    error,
  } = useAppSelector((state) => state.boards);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchBoards());
  }, [dispatch]);

  const handleCreateBoard = () => {
    if (newBoardTitle.trim() === "") return;

    setIsCreating(true);
    dispatch(createBoard(newBoardTitle.trim()))
      .unwrap()
      .then(() => setNewBoardTitle(""))
      .catch((err) => console.error("Pano oluşturulurken hata:", err))
      .finally(() => setIsCreating(false));
  };

  const handleDeleteBoard = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();

    if (
      window.confirm(
        "Bu çalışma alanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      )
    ) {
      setDeletingBoardId(boardId);
      dispatch(deleteBoard(boardId))
        .unwrap()
        .catch((err) => console.error("Silme hatası:", err))
        .finally(() => setDeletingBoardId(null));
    }
  };

  const safeBoards = Array.isArray(boards) ? boards : [];

  return (
    <Box
      p={{ base: 6, md: 12 }}
      maxW="1200px"
      mx="auto"
      minH="100vh"
      color={theme.textMain}
    >
      <Box mb={10}>
        <Heading
          size="2xl"
          fontFamily="'Manrope', sans-serif"
          fontWeight="900"
          letterSpacing="tight"
        >
          Çalışma Alanları
        </Heading>
        <Text color={theme.textMuted} fontSize="sm" mt={2}>
          Tüm projelerinizi ve operasyon panolarınızı buradan yönetin.
        </Text>
      </Box>

      {/* YENİ PANO EKLEME */}
      <Flex
        bg={theme.cardBg}
        p={2}
        borderRadius="xl"
        border="1px solid"
        borderColor={theme.borderCol}
        align="center"
        mb={12}
        transition="all 0.2s"
        _focusWithin={{
          borderColor: "#c6d4f7",
          boxShadow: "0 0 0 1px #c6d4f720",
        }}
      >
        <Box pl={4} color={theme.textMuted}>
          <FolderKanban size={20} />
        </Box>
        <Input
          placeholder="Yeni pano adı girin (Örn: Proje Alpha)"
          value={newBoardTitle}
          onChange={(e) => setNewBoardTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
          variant="flushed"
          color={theme.textMain}
          px={4}
          py={3}
          flex="1"
          _placeholder={{ color: theme.textMuted, opacity: 0.7 }}
          bg={theme.inputBg}
          _focus={{ outline: "none", boxShadow: "none" }}
          disabled={isCreating}
        />
        <Button
          bg="#c6d4f7"
          color="#0c0e11"
          fontWeight="bold"
          borderRadius="lg"
          px={6}
          onClick={handleCreateBoard}
          loading={isCreating}
          disabled={!newBoardTitle.trim() || isCreating}
          _hover={{ bg: "#b8c6e8", transform: "translateY(-1px)" }}
          _active={{ transform: "scale(0.98)" }}
          transition="all 0.2s"
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Plus size={18} /> Oluştur
        </Button>
      </Flex>

      {error && (
        <Box p={4} mb={6} bg="red.900" color="red.200" borderRadius="md">
          {error}
        </Box>
      )}

      {isLoading && safeBoards.length === 0 ? (
        <Flex justify="center" align="center" py={20} color={theme.textMuted}>
          <Spinner size="xl" color="#c6d4f7" mr={4} />
          <Text>Panolarınız yükleniyor...</Text>
        </Flex>
      ) : safeBoards.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py={24}
          px={4}
          bg={theme.emptyStateBg}
          borderRadius="2xl"
          border="1px dashed"
          borderColor={theme.borderCol}
          textAlign="center"
        >
          <Box color={theme.textMuted} mb={4}>
            <LayoutDashboard size={56} strokeWidth={1.5} />
          </Box>
          <Heading size="md" color={theme.textMain} mb={2}>
            Henüz hiç pano oluşturmadınız
          </Heading>
          <Text color={theme.textMuted} fontSize="sm" maxW="sm">
            Projelerinizi organize etmeye başlamak için yukarıdaki alanı
            kullanarak ilk çalışma alanınızı yaratın.
          </Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {safeBoards.map((board) => {
            const isOwner = currentUser?.id === board.ownerId;

            return (
              <Flex
                key={board.id}
                direction="column"
                bg={theme.cardBg}
                p={6}
                borderRadius="xl"
                border="1px solid"
                borderColor={theme.borderCol}
                cursor="pointer"
                role="group"
                transition="all 0.3s"
                position="relative" /* YENİ EKLENDİ: İçindeki absolute elementleri bu karta göre hizalar */
                _hover={{
                  bg: theme.cardHoverBg,
                  borderColor: "#c6d4f750",
                  transform: "translateY(-4px)",
                  boxShadow: theme.isDark
                    ? "0 10px 30px -10px rgba(0,0,0,0.5)"
                    : "xl",
                }}
                onClick={() => navigate(`/boards/${board.id}`)}
              >
                {/* --- SİLME BUTONU (SADECE OWNER İÇİN VE TAM SAĞ ÜST KÖŞEDE) --- */}
                {isOwner && (
                  <Flex
                    as="button"
                    position="absolute" /* YENİ: Kartın normal akışından çıkardık */
                    top={4} /* YENİ: Üstten boşluk */
                    right={4} /* YENİ: Sağdan boşluk */
                    zIndex={
                      2
                    } /* YENİ: Tıklanabilir olması için üstte tutuyoruz */
                    align="center"
                    justify="center"
                    w="32px"
                    h="32px"
                    borderRadius="md"
                    color={theme.textMuted}
                    transition="all 0.2s"
                    opacity={deletingBoardId === board.id ? "0.5" : "1"}
                    pointerEvents={
                      deletingBoardId === board.id ? "none" : "auto"
                    }
                    _hover={{
                      color: "#ef4444",
                      bg: theme.isDark ? "#ef444420" : "#fee2e2",
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // Kartın içine girilmesini engelle
                      if (deletingBoardId === board.id) return;
                      handleDeleteBoard(e, board.id);
                    }}
                    title="Panoyu Sil"
                  >
                    {deletingBoardId === board.id ? (
                      <Spinner size="xs" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </Flex>
                )}

                {/* --- KARTIN NORMAL İÇERİĞİ --- */}
                <Flex justify="space-between" align="flex-start" mb={6}>
                  <Flex
                    w="44px"
                    h="44px"
                    bg={theme.iconBoxBg}
                    borderRadius="lg"
                    align="center"
                    justify="center"
                    color="#c6d4f7"
                    border="1px solid"
                    borderColor={theme.borderCol}
                    transition="all 0.2s"
                    _groupHover={{ bg: "#c6d4f7", color: "#0c0e11" }}
                  >
                    <LayoutDashboard size={20} />
                  </Flex>

                  {/* Sadece Ok İkonu (Sağ Orta) */}
                  <Box
                    color={theme.textMuted}
                    transition="all 0.2s"
                    transform="translateX(-10px)"
                    opacity="0"
                    _groupHover={{ opacity: "1", transform: "translateX(0)" }}
                  >
                    <ChevronRight size={20} />
                  </Box>
                </Flex>

                <Heading
                  size="md"
                  fontFamily="'Inter', sans-serif"
                  color={theme.textMain}
                  mb={2}
                  pr={
                    8
                  } /* İsmin butonla çakışmaması için sağa boşluk ekledik */
                >
                  {board.title}
                </Heading>

                <Flex
                  align="center"
                  gap={2}
                  color={theme.textMuted}
                  fontSize="xs"
                  mt="auto"
                >
                  <Clock size={14} />
                  <Text>
                    Oluşturulma:{" "}
                    {board.createdAt
                      ? new Date(board.createdAt).toLocaleDateString("tr-TR")
                      : "Bilinmiyor"}
                  </Text>
                </Flex>
              </Flex>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default BoardList;
