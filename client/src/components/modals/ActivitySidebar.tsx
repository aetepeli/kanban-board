import { Box, Flex, Heading, Text, Button } from "@chakra-ui/react";
import { Activity } from "lucide-react";
import { useThemeColors } from "../../theme/useThemeColors";
import type * as boardTypes from "../../types/board.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  boardLogs: boardTypes.BoardActivityLog[];
}

const ActivitySidebar = ({ isOpen, onClose, boardLogs }: Props) => {
  const theme = useThemeColors();
  if (!isOpen) return null;

  return (
    <>
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
            <Activity size={20} /> Board Activity
          </Heading>
          <Button size="sm" variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </Flex>
        <Flex direction="column" gap={4}>
          {boardLogs.length === 0 ? (
            <Text color={theme.textMuted} fontSize="sm">
              There is no activity yet.
            </Text>
          ) : (
            boardLogs.map((log) => (
              <Box
                key={log.id}
                borderBottom="1px solid"
                borderColor={theme.borderCol}
                pb={3}
              >
                <Text color={theme.textMain} fontSize="sm">
                  <Text as="span" fontWeight="bold">
                    {log.user.fullName}
                  </Text>{" "}
                  {log.action}
                </Text>
                <Text color={theme.textMuted} fontSize="xs" mt={1}>
                  {new Date(log.createdAt).toLocaleString()}
                </Text>
              </Box>
            ))
          )}
        </Flex>
      </Box>
    </>
  );
};

export default ActivitySidebar;
