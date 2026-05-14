import { useState } from "react";
import {
  Flex,
  Box,
  Heading,
  Text,
  Input,
  Button,
  Separator,
} from "@chakra-ui/react";
import { Check, Link as LinkIcon } from "lucide-react";
import { useThemeColors } from "../../theme/useThemeColors";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inviteLink: string;
  showToast: (title: string, desc: string, type: "success" | "info") => void;
}

const ShareBoardModal = ({ isOpen, onClose, inviteLink, showToast }: Props) => {
  const theme = useThemeColors();
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    showToast(
      "Link kopyalandı!",
      "Bu bağlantıya sahip herkes panoya katılma isteği gönderebilir.",
      "success",
    );
    setTimeout(() => setIsCopied(false), 2000);
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
        maxW="450px"
        p={8}
        borderRadius="xl"
        border="1px solid"
        borderColor={theme.borderCol}
        shadow="2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Heading
          fontFamily="'Manrope', sans-serif"
          fontSize="xl"
          mb={2}
          color={theme.textMain}
        >
          Share Board
        </Heading>
        <Text color={theme.textMuted} fontSize="sm" mb={6}>
          Anyone with this link can request access.
        </Text>
        <Flex gap={2} mb={6}>
          <Input
            value={inviteLink}
            readOnly
            bg={theme.inputBg}
            color={theme.textMain}
            border="1px solid"
            borderColor={theme.borderCol}
            fontSize="sm"
            _focus={{ outline: "none" }}
          />
          <Button
            bg={isCopied ? "green.500" : "#c6d4f7"}
            color={isCopied ? "white" : "#0c0e11"}
            onClick={handleCopyLink}
            w="100px"
            _hover={{ bg: isCopied ? "green.600" : "#b8c6e8" }}
          >
            {isCopied ? <Check size={18} /> : "Kopyala"}
          </Button>
        </Flex>
        <Separator borderColor={theme.borderCol} mb={6} />
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={3}>
            <Flex
              w="36px"
              h="36px"
              bg={theme.avatarBg}
              color={theme.avatarCol}
              borderRadius="full"
              align="center"
              justify="center"
            >
              <LinkIcon size={16} />
            </Flex>
            <Box>
              <Text color={theme.textMain} fontSize="sm" fontWeight="bold">
                Link Access
              </Text>
              <Text color={theme.textMuted} fontSize="xs">
                Restricted (Request Only)
              </Text>
            </Box>
          </Flex>
          <Button
            size="sm"
            variant="ghost"
            color={theme.textMuted}
            onClick={onClose}
          >
            Done
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};

export default ShareBoardModal;
