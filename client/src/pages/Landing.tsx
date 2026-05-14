import { Box, Flex, Heading, Text, Button, SimpleGrid } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Compass, ArrowRight, Layout, Zap, Shield } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <Box
      minH="100vh"
      bg="#0c0e11"
      color="#e0e6f1"
      fontFamily="'Inter', sans-serif"
      overflowX="hidden"
    >
      {/* --- ÜST MENÜ (Log In / Sign Up) --- */}
      <Flex
        as="nav"
        w="full"
        h="80px"
        align="center"
        justify="space-between"
        px={{ base: 6, md: 12 }}
        borderBottom="1px solid"
        borderColor="#42485120"
      >
        <Flex align="center" gap={3}>
          <Flex
            w="32px"
            h="32px"
            bg="#1b2027"
            borderRadius="sm"
            align="center"
            justify="center"
            color="#c6d4f7"
          >
            <Compass size={20} />
          </Flex>
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="#b8c6e8"
            letterSpacing="widest"
            fontFamily="'Manrope', sans-serif"
          >
            Architect Kanban
          </Text>
        </Flex>

        <Flex gap={4} align="center">
          <Button
            variant="ghost"
            color="#a5abb6"
            _hover={{ color: "white", bg: "transparent" }}
            onClick={() => navigate("/login")}
          >
            Sign In
          </Button>
          <Button
            bg="#c6d4f7"
            color="#0c0e11"
            fontWeight="bold"
            px={6}
            borderRadius="sm"
            _hover={{ bg: "#b8c6e8" }}
            onClick={() => navigate("/register")}
          >
            Get Started
          </Button>
        </Flex>
      </Flex>

      {/* HERO SECTION */}
      <Flex
        direction="column"
        align="center"
        justify="center"
        textAlign="center"
        pt={{ base: 20, md: 32 }}
        pb={{ base: 16, md: 24 }}
        px={6}
      >
        <Box
          border="1px solid"
          borderColor="#c6d4f730"
          bg="#c6d4f710"
          color="#c6d4f7"
          px={4}
          py={1}
          borderRadius="full"
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="wider"
          mb={8}
        >
          Architect Kanban v2.0 is live
        </Box>

        <Heading
          fontSize={{ base: "4xl", md: "7xl" }}
          fontFamily="'Manrope', sans-serif"
          fontWeight="900"
          letterSpacing="tight"
          lineHeight="1.1"
          maxW="4xl"
          mb={6}
          color="white"
        >
          The Digital Atelier for <br />
          <Text as="span" color="#c6d4f7">
            Modern Strategy.
          </Text>
        </Heading>

        <Text
          fontSize={{ base: "lg", md: "xl" }}
          color="#a5abb6"
          maxW="2xl"
          mb={10}
          lineHeight="relaxed"
        >
          Refine your workflow with precision. A minimalist, powerful Kanban
          workspace designed for teams who build the future. No clutter, just
          pure focus.
        </Text>

        <Flex gap={4} direction={{ base: "column", sm: "row" }}>
          <Button
            h="56px"
            px={8}
            bg="#c6d4f7"
            color="#0c0e11"
            fontSize="md"
            fontWeight="bold"
            borderRadius="sm"
            _hover={{ bg: "#b8c6e8", transform: "translateY(-2px)" }}
            transition="all 0.2s"
            display="flex"
            alignItems="center"
            gap={2}
            onClick={() => navigate("/register")}
          >
            Start Building Free <ArrowRight size={18} />
          </Button>
          <Button
            h="56px"
            px={8}
            variant="outline"
            borderColor="#42485150"
            color="white"
            fontSize="md"
            fontWeight="semibold"
            borderRadius="sm"
            _hover={{ bg: "#161a1f" }}
            transition="all 0.2s"
          >
            View Documentation
          </Button>
        </Flex>
      </Flex>

      {/* FEATURES */}
      <Box
        maxW="1200px"
        mx="auto"
        px={6}
        py={20}
        borderTop="1px solid"
        borderColor="#42485120"
      >
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={12}>
          <Box>
            <Flex
              w="48px"
              h="48px"
              bg="#161a1f"
              border="1px solid"
              borderColor="#42485140"
              borderRadius="md"
              align="center"
              justify="center"
              color="#c6d4f7"
              mb={5}
            >
              <Layout size={24} />
            </Flex>
            <Heading
              fontSize="xl"
              fontFamily="'Manrope', sans-serif"
              color="white"
              mb={3}
            >
              Architectural Clarity
            </Heading>
            <Text color="#a5abb6" fontSize="sm" lineHeight="tall">
              Visualize your entire project landscape. Drag, drop, and structure
              your tasks with pixel-perfect precision and zero visual noise.
            </Text>
          </Box>

          <Box>
            <Flex
              w="48px"
              h="48px"
              bg="#161a1f"
              border="1px solid"
              borderColor="#42485140"
              borderRadius="md"
              align="center"
              justify="center"
              color="#c6d4f7"
              mb={5}
            >
              <Zap size={24} />
            </Flex>
            <Heading
              fontSize="xl"
              fontFamily="'Manrope', sans-serif"
              color="white"
              mb={3}
            >
              Lightning Fast
            </Heading>
            <Text color="#a5abb6" fontSize="sm" lineHeight="tall">
              Built on modern state management. Every interaction, from moving
              cards to adding comments, feels instantaneous and fluid.
            </Text>
          </Box>

          <Box>
            <Flex
              w="48px"
              h="48px"
              bg="#161a1f"
              border="1px solid"
              borderColor="#42485140"
              borderRadius="md"
              align="center"
              justify="center"
              color="#c6d4f7"
              mb={5}
            >
              <Shield size={24} />
            </Flex>
            <Heading
              fontSize="xl"
              fontFamily="'Manrope', sans-serif"
              color="white"
              mb={3}
            >
              Enterprise Grade
            </Heading>
            <Text color="#a5abb6" fontSize="sm" lineHeight="tall">
              Your strategy is safe. Role-based access, secure authentication,
              and immutable audit logs keep your atelier protected.
            </Text>
          </Box>
        </SimpleGrid>
      </Box>

      {/* FOOTER */}
      <Flex
        borderTop="1px solid"
        borderColor="#42485120"
        py={8}
        px={6}
        justify="center"
        align="center"
      >
        <Text
          fontSize="xs"
          color="#424851"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="widest"
        >
          © 2026 Architect Kanban. Designed with precision.
        </Text>
      </Flex>
    </Box>
  );
};

export default Landing;
