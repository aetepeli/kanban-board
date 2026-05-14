import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  Separator,
  Badge,
} from "@chakra-ui/react";
import { Users } from "lucide-react";
import { useThemeColors } from "../../theme/useThemeColors";
import type * as boardTypes from "../../types/board.types";
import { useAppDispatch, useAppSelector } from "../../hooks/redux.hooks"; // YENİ
import {
  addBoardMember,
  removeBoardMember,
} from "../../features/boards/boardSlice"; // YENİ

interface Props {
  isOpen: boolean;
  onClose: () => void;
  boardMembers: boardTypes.BoardMember[];
  boardId: string; // YENİ: Hangi panoda işlem yaptığımızı bilmek için
  ownerId: string; // YENİ: Panonun sahibinin ID'si
  showToast: (
    title: string,
    desc: string,
    type: "success" | "info" | "error",
  ) => void; // "error" tipini de ekledik
}

const MembersSidebar = ({
  isOpen,
  onClose,
  boardMembers,
  boardId,
  ownerId,
  showToast,
}: Props) => {
  const theme = useThemeColors();
  const dispatch = useAppDispatch();
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mevcut giriş yapmış olan kullanıcıyı alıyoruz
  const { user: currentUser } = useAppSelector((state) => state.auth);

  if (!isOpen) return null;

  // Güvenlik Kontrolü: Şu anki kullanıcı bu panonun sahibi mi?
  const isOwner = currentUser?.id === ownerId;

  const handleInviteMember = () => {
    if (newMemberEmail.trim() === "") return;
    setIsLoading(true);

    dispatch(addBoardMember({ boardId, email: newMemberEmail.trim() }))
      .unwrap()
      .then(() => {
        showToast(
          "Davetiye Gönderildi",
          `${newMemberEmail} başarıyla eklendi.`,
          "success",
        );
        setNewMemberEmail("");
      })
      .catch((err) => {
        showToast(
          "Hata",
          typeof err === "string" ? err : "Davet gönderilemedi.",
          "error",
        );
      })
      .finally(() => setIsLoading(false));
  };

  const handleRemoveMember = (memberIdToRemove: string) => {
    if (!window.confirm("Bu üyeyi panodan çıkarmak istediğinize emin misiniz?"))
      return;

    dispatch(removeBoardMember({ boardId, memberId: memberIdToRemove }))
      .unwrap()
      .then(() => {
        showToast(
          "Üye Silindi",
          "Kullanıcı panodan başarıyla çıkarıldı.",
          "info",
        );
      })
      .catch((err) => {
        showToast(
          "Hata",
          typeof err === "string" ? err : "Üye çıkarılamadı.",
          "error",
        );
      });
  };

  return (
    <>
      {/* ... arka plan overlay ve sidebar container aynı kalıyor ... */}
      <Box
        position="fixed"
        inset="0"
        bg="blackAlpha.600"
        zIndex={998}
        onClick={onClose}
      />
      <Box
        position="fixed"
        top="0"
        right="0"
        w={{ base: "100%", md: "400px" }}
        h="100vh"
        bg={theme.cardBg}
        zIndex={999}
        borderLeft="1px solid"
        borderColor={theme.borderCol}
        p={6}
        shadow="2xl"
        overflowY="auto"
        transition="all 0.3s"
      >
        <Flex justify="space-between" align="center" mb={6}>
          <Heading
            size="md"
            color={theme.textMain}
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Users size={20} /> Board Members
          </Heading>
          <Button size="sm" variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </Flex>

        {/* EĞER KULLANICI OWNER İSE DAVET FORMU GÖRÜNECEK */}
        {isOwner && (
          <Box mb={8}>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color={theme.textMuted}
              mb={2}
            >
              Invite New Member
            </Text>
            <Flex gap={2}>
              <Input
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInviteMember()}
                placeholder="Email adresi"
                size="sm"
                bg={theme.inputBg}
                border="1px solid"
                borderColor={theme.borderCol}
                disabled={isLoading}
              />
              <Button
                size="sm"
                bg="#c6d4f7"
                color="#0c0e11"
                onClick={handleInviteMember}
                loading={isLoading}
              >
                Davet Et
              </Button>
            </Flex>
          </Box>
        )}

        <Separator borderColor={theme.borderCol} mb={6} />

        <Flex direction="column" gap={4}>
          {boardMembers.length === 0 ? (
            <Text color={theme.textMuted} fontSize="sm">
              There are no members in this board yet.
            </Text>
          ) : (
            boardMembers.map((member) => {
              const memberId = member.user.id;
              const memberName = member.user.fullName;
              const initials = memberName.charAt(0).toUpperCase();

              return (
                <Flex
                  key={memberId}
                  justify="space-between"
                  align="center"
                  p={2}
                  _hover={{ bg: theme.colBg }}
                  borderRadius="md"
                >
                  <Flex align="center" gap={3}>
                    <Flex
                      w="36px"
                      h="36px"
                      bg={member.role === "OWNER" ? "#c6d4f7" : theme.avatarBg}
                      color={
                        member.role === "OWNER" ? "#0c0e11" : theme.avatarCol
                      }
                      borderRadius="full"
                      align="center"
                      justify="center"
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      {initials}
                    </Flex>
                    <Box>
                      <Text
                        color={theme.textMain}
                        fontSize="sm"
                        fontWeight="bold"
                      >
                        {memberName}
                        {member.role === "OWNER" && (
                          <Badge
                            ml={2}
                            bg="#c6d4f7"
                            color="#0c0e11"
                            fontSize="10px"
                          >
                            Owner
                          </Badge>
                        )}
                      </Text>
                      <Text color={theme.textMuted} fontSize="xs">
                        {member.role === "OWNER" ? "Admin" : "Member"}
                      </Text>
                    </Box>
                  </Flex>
                  {/* SADECE OWNER SİLME BUTONUNU GÖREBİLİR VE KENDİSİNİ SİLEMEZ */}
                  {isOwner && member.role !== "OWNER" && (
                    <Button
                      size="xs"
                      variant="ghost"
                      color="red.400"
                      _hover={{ bg: "red.400", color: "white" }}
                      onClick={() => handleRemoveMember(memberId)}
                    >
                      Remove
                    </Button>
                  )}
                </Flex>
              );
            })
          )}
        </Flex>
      </Box>
    </>
  );
};

export default MembersSidebar;
