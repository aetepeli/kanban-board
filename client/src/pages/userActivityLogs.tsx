import { useState, useEffect } from "react"; // useEffect eklendi
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import {
  Search,
  MessageSquare,
  ArrowRightLeft,
  LayoutDashboard,
  Trash2,
  Activity,
} from "lucide-react";

import { useThemeColors } from "../theme/useThemeColors";
import { useAppDispatch, useAppSelector } from "../hooks/redux.hooks";
import { fetchUserLogs } from "../features/auth/authSlice";

const ActivityLog = () => {
  const theme = useThemeColors();
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");

  const { user, userLogs, isLoading } = useAppSelector((state) => state.auth);

  console.log("2. REDUX'TAKİ LOGLAR:", userLogs);

  useEffect(() => {
    dispatch(fetchUserLogs());
  }, [dispatch]);

  const getActionConfig = (type: string) => {
    const normalizedType = type.toLowerCase();

    if (normalizedType.includes("move") || normalizedType.includes("taşı")) {
      return {
        icon: <ArrowRightLeft size={16} />,
        bg: theme.isDark ? "#2b6cb030" : "#ebf8ff",
        color: theme.isDark ? "#90cdf4" : "#3182ce",
      };
    }
    if (
      normalizedType.includes("comment") ||
      normalizedType.includes("yorum")
    ) {
      return {
        icon: <MessageSquare size={16} />,
        bg: theme.isDark ? "#805ad530" : "#faf5ff",
        color: theme.isDark ? "#d6bcfa" : "#805ad5",
      };
    }
    if (
      normalizedType.includes("create") ||
      normalizedType.includes("oluştur")
    ) {
      return {
        icon: <LayoutDashboard size={16} />,
        bg: theme.isDark ? "#31979530" : "#ebf4ff",
        color: theme.isDark ? "#b3bcf5" : "#319795",
      };
    }
    if (normalizedType.includes("delete") || normalizedType.includes("sil")) {
      return {
        icon: <Trash2 size={16} />,
        bg: theme.isDark ? "#e53e3e30" : "#fff5f5",
        color: theme.isDark ? "#fc8181" : "#e53e3e",
      };
    }
    return {
      icon: <Activity size={16} />,
      bg: theme.iconBoxBg,
      color: theme.textMuted,
    };
  };

  const filteredLogs = (userLogs || []).filter((log) => {
    return log.action.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Box
      p={{ base: 6, md: 12 }}
      maxW="1000px"
      mx="auto"
      minH="100vh"
      color={theme.textMain}
      fontFamily="'Inter', sans-serif"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        gap={6}
        mb={10}
      >
        <Box>
          <Heading
            size="2xl"
            fontFamily="'Manrope', sans-serif"
            fontWeight="900"
            letterSpacing="tight"
            color={theme.textMain}
          >
            My Activity
          </Heading>
          <Text color={theme.textMuted} fontSize="sm" mt={2}>
            Track your personal actions and history across all workspaces.
          </Text>
        </Box>
      </Flex>

      <Flex
        bg={theme.cardBg}
        p={2}
        borderRadius="xl"
        border="1px solid"
        borderColor={theme.borderCol}
        align="center"
        mb={10}
      >
        <Box pl={4} color={theme.textMuted}>
          <Search size={20} />
        </Box>
        <Input
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="flushed"
          flex="1"
          border="none"
          _focus={{ ring: 0, outline: "none" }}
        />
      </Flex>

      <Box
        bg={theme.cardBg}
        borderRadius="xl"
        border="1px solid"
        borderColor={theme.borderCol}
        p={{ base: 4, md: 8 }}
      >
        {isLoading ? (
          <Flex justify="center" py={10}>
            <Spinner size="xl" color="#c6d4f7" />
          </Flex>
        ) : filteredLogs.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={12}
            color={theme.textMuted}
          >
            <Box mb={4} opacity={0.5}>
              <Activity size={48} />
            </Box>
            <Text>You have no recent activities matching your search.</Text>
          </Flex>
        ) : (
          <Flex direction="column" gap={6} position="relative">
            <Box
              position="absolute"
              left="24px"
              top="10px"
              bottom="10px"
              w="2px"
              bg={theme.borderCol}
              zIndex={0}
              display={{ base: "none", md: "block" }}
            />

            {filteredLogs.map((log) => {
              const config = getActionConfig(log.action);

              return (
                <Flex
                  key={log.id}
                  gap={4}
                  align="flex-start"
                  position="relative"
                  zIndex={1}
                >
                  <Flex
                    direction="column"
                    align="center"
                    gap={2}
                    display={{ base: "none", md: "flex" }}
                  >
                    <Flex
                      w="48px"
                      h="48px"
                      bg={theme.mainBg}
                      borderRadius="full"
                      align="center"
                      justify="center"
                      border="2px solid"
                      borderColor={theme.borderCol}
                      zIndex={2}
                    >
                      <Flex
                        w="36px"
                        h="36px"
                        bg={config.bg}
                        color={config.color}
                        borderRadius="full"
                        align="center"
                        justify="center"
                      >
                        {config.icon}
                      </Flex>
                    </Flex>
                  </Flex>

                  <Box
                    flex="1"
                    bg={theme.mainBg}
                    p={4}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={theme.borderCol}
                    _hover={{ borderColor: "#c6d4f750", bg: theme.cardHoverBg }}
                  >
                    <Flex
                      justify="space-between"
                      align={{ base: "flex-start", md: "center" }}
                      mb={2}
                      gap={2}
                    >
                      <Flex align="center" gap={3}>
                        <Flex
                          w="28px"
                          h="28px"
                          bg={theme.avatarBg}
                          color={theme.avatarCol}
                          borderRadius="full"
                          align="center"
                          justify="center"
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          {user?.fullName?.substring(0, 2).toUpperCase() ||
                            "ME"}
                        </Flex>
                        <Text
                          color={theme.textMain}
                          fontWeight="bold"
                          fontSize="sm"
                        >
                          {user?.fullName || "Me"}
                        </Text>
                      </Flex>
                      <Text
                        fontSize="xs"
                        color={theme.textMuted}
                        fontWeight="medium"
                      >
                        {new Date(log.createdAt).toLocaleString()}
                      </Text>
                    </Flex>

                    <Text
                      color={theme.textMuted}
                      fontSize="sm"
                      lineHeight="tall"
                    >
                      {log.action}
                    </Text>

                    {log.details && (
                      <Flex
                        mt={3}
                        pt={3}
                        borderTop="1px solid"
                        borderColor={theme.borderCol}
                        align="center"
                        justify="space-between"
                      >
                        <Badge
                          bg={theme.iconBoxBg}
                          color={theme.textMuted}
                          px={2}
                          py={1}
                          borderRadius="md"
                          fontSize="10px"
                        >
                          {log.details}
                        </Badge>
                      </Flex>
                    )}
                  </Box>
                </Flex>
              );
            })}
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default ActivityLog;
