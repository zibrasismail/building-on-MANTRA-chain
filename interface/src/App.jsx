import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  List,
  ListItem,
  Flex,
  IconButton,
  useColorMode,
  useColorModeValue,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Tag,
  Tooltip,
  Container,
  Spacer,
  Progress,
  useToast,
} from "@chakra-ui/react";
import {
  DeleteIcon,
  EditIcon,
  MoonIcon,
  SunIcon,
  CheckIcon,
  TimeIcon,
  WarningIcon,
  QuestionIcon,
  AddIcon,
} from "@chakra-ui/icons";
import { useAccount, useConnect, useDisconnect } from "graz";
import { useTodoContract } from './hooks/useTodoContract';
import { checkKeplrInstalled, getKeplrInstallUrl } from './utils/keplrUtils';

export default function App() {
  const { data: account, isConnected, isConnecting, isDisconnected, isReconnecting } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { fetchTodos, addTodo, updateTodo, deleteTodo, loading, setLoading } = useTodoContract();
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();

  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ newTodo:"", priority:"none"});
  const [status, setStatus] = useState("To Do")
  const [description, setDescription] = useState("");
  const [todoPriority, setTodoPriority] = useState("none");
  const [isOpen, setIsOpen] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState(null);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const headerBgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");

  const getPriorityIcon = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return <WarningIcon color="red.500" />;
      case 'medium': return <WarningIcon color="yellow.500" />;
      case 'low': return <WarningIcon color="green.500" />;
      default: return <QuestionIcon color="gray.500" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckIcon color="green.500" />;
      case 'in_progress': return <TimeIcon color="blue.500" />;
      default: return <QuestionIcon color="gray.500" />;
    }
  };

  const formatStatus = (status) => {
    const words = status.split('_');
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const calculateProgress = useCallback(() => {
    const totalTodos = todos.length;
    const completedTodos = todos.filter(todo => {
      const status = String(todo.status).toLowerCase();
      return status === "completed" || status === "done";
    }).length;
    return totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;
  }, [todos]);

  const groupTodosByStatus = useCallback(() => {
    return todos.reduce((acc, todo) => {
      const status = todo.status.toLowerCase();
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(todo);
      return acc;
    }, {});
  }, [todos, toast]);

  const connectWallet = async() => {
    if (!checkKeplrInstalled()) {
      const installUrl = getKeplrInstallUrl();
      if (window.confirm("Keplr wallet is not installed. Would you like to install it now?")) {
        window.open(installUrl, '_blank');
      }
    } else {
      try {
        connect({ chainId: "mantra-hongbai-1" })
      } catch (error) {
        console.error("Failed to connect:", error);
        alert("Failed to connect. Please make sure Keplr is set up correctly.");
      }
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchTodos().then(setTodos).catch(error => {
        console.error("Failed to fetch todos:", error);
        toast({
          title: "Error fetching to dos",
          description: "Please try again later.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
    }
  }, [isConnected, fetchTodos, toast]);

  const handleAddTodo = useCallback(() => {
    if (newTodo.newTodo.trim()) {
      addTodo(newTodo.newTodo, newTodo.priority)
        .then((newId) => {
          setTodos(prev => [...prev, { id: newId, description: newTodo.newTodo, priority: newTodo.priority, status: "to_do" }]);
          setNewTodo({ newTodo:"", priority:"none"});
          toast({
            title: "To do added",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
        })
        .catch(error => {
          console.error("Failed to add todo:", error);
          setLoading(false);
          toast({
            title: "Error adding to do",
            description: "Please try again.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        });
    }
  }, [newTodo, todoPriority, addTodo, toast]);

  const handleEditTodo = useCallback((todo) => {
    setEditingTodoId(todo.id);
    setStatus(todo.status);
    setTodoPriority(todo.priority);
    setDescription(todo.description);
  }, []);

  const handleSaveTodo = (id) => {
    updateTodo(id, description, status, todoPriority)
      .then(() => {
        setTodos(prev => prev.map(todo => 
          todo.id === id ? { ...todo, description, status, priority: todoPriority } : todo
        ));
        setEditingTodoId(null);
        toast({
          title: "To do updated",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      })
      .catch(error => {
        console.error("Failed to update todo:", error);
        setLoading(false);
        toast({
          title: "Error updating to do",
          description: "Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
  };

  const handleDeleteTodo = useCallback((id) => {
    deleteTodo(id)
      .then(() => {
        setTodos(prev => prev.filter(todo => todo.id !== id));
        toast({
          title: "To do deleted",
          status: "info",
          duration: 2000,
          isClosable: true,
        });
      })
      .catch(error => {
        console.error("Failed to delete todo:", error);
        setLoading(false);
        toast({
          title: "Error deleting to do",
          description: "Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
  }, [deleteTodo, toast]);

  return (
    <Box height="100vh" width="100vw" overflow="hidden">
      <Flex direction="column" height="100%">
        {/* Header */}
        <Box py={4} px={8} bg={headerBgColor} boxShadow="sm">
          <Flex justify="space-between" align="center">
            <Heading size="lg" color={textColor}>To Do App</Heading>
            <HStack spacing={4}>
              {account && (
                <Text fontSize="sm" color={textColor}>
                  <Box border="dotted" p={1} borderRadius={5}>
                    {account.bech32Address.slice(0, 8)}...{account.bech32Address.slice(-4)}
                  </Box>
                </Text>
              )}
              <Button
                size="sm"
                colorScheme={isConnected ? "red" : "blue"}
                onClick={() => isConnected ? disconnect() : connectWallet()}
                isLoading={isConnecting || isReconnecting}
                loadingText="Connecting"
              >
                {isConnected ? "Disconnect" : "Connect Wallet"}
              </Button>
              <IconButton
                icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="ghost"
                aria-label="Toggle color mode"
              />
            </HStack>
          </Flex>
        </Box>

        {/* Progress Bar */}
        {isConnected && (
          <Box px={8} py={2} bg={headerBgColor}>
            <Text mb={2} color={textColor}>Overall Progress: {calculateProgress().toFixed(0)}%</Text>
            <Progress value={calculateProgress()} colorScheme="blue" size="sm" />
          </Box>
        )}

        {/* Main Content */}
        <Box flex="1" overflow="auto" bg={bgColor}>
          <Container maxW="container.xl" py={8}>
            {isConnected ? (
              <VStack spacing={8} align="stretch">
                {/* Add Todo Section */}
                <Box bg={headerBgColor} p={6} borderRadius="lg" boxShadow="md">
                  <Heading color={textColor} size="md" mb={4}>Add New To Do</Heading>
                  <HStack>
                    <Input
                      value={newTodo.newTodo}
                      onChange={(e) => setNewTodo({...newTodo, newTodo: e.target.value})}
                      placeholder="Enter a new todo"
                      flex={1}
                      color={textColor}
                    />
                    <Select
                      value={newTodo.priority}
                      onChange={(e) => setNewTodo({...newTodo, priority: e.target.value})}
                      width="150px"
                      color={textColor}
                    >
                      <option value="none">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Select>
                    <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAddTodo} loadingText="Adding" isActive={loading}>
                      Add
                    </Button>
                  </HStack>
                </Box>

                {/* Todo List */}
                <Box>
                  <Heading color={textColor} size="md" mb={4}>Your To-Dos</Heading>
                  {['to_do', 'in_progress', 'done', 'cancelled'].map(statusGroup => {
                    const groupedTodos = groupTodosByStatus();
                    const todosInGroup = groupedTodos[statusGroup] || [];
                    return (
                      <Box key={statusGroup} mb={6}>
                        <Heading size="sm" color={textColor} mb={2}>
                          {formatStatus(statusGroup)} ({todosInGroup.length})
                        </Heading>
                        <List spacing={3}>
                          {todosInGroup.map((todo) => (
                            <ListItem
                              key={todo.id}
                              p={4}
                              bg={headerBgColor}
                              borderRadius="md"
                              boxShadow="sm"
                              _hover={{ boxShadow: "md" }}
                              transition="all 0.2s"
                            >
                              <Flex align="center">
                                {editingTodoId === todo.id ? (
                                  <>
                                    <Input
                                      value={description}
                                      onChange={(e) => setDescription(e.target.value)}
                                      color={textColor}
                                      mr={2}
                                    />
                                    <Select
                                      value={todoPriority}
                                      onChange={(e) => setTodoPriority(e.target.value)}
                                      color={textColor}
                                      width="160px"
                                      mr={2}
                                    >
                                      <option value="none">None</option>
                                      <option value="low">Low</option>
                                      <option value="medium">Medium</option>
                                      <option value="high">High</option>
                                    </Select>
                                    <Select
                                      value={status}
                                      onChange={(e) => setStatus(e.target.value)}
                                      color={textColor}
                                      width="200px"
                                      mr={2}
                                    >
                                      <option value="to_do">To Do</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="done">Completed</option>
                                      <option value="cancelled">Cancelled</option>
                                    </Select>
                                    <Button colorScheme="green" size="sm" onClick={() => handleSaveTodo(todo.id)} loadingText="Saving" isLoading={loading} mr={2}>
                                      Save
                                    </Button>
                                    <Button colorScheme="red" size="sm" onClick={() => setEditingTodoId(null)} isActive={loading}>
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Tooltip label={`Priority: ${todo.priority}`}>
                                      <Box mr={3}>{getPriorityIcon(todo.priority)}</Box>
                                    </Tooltip>
                                    <Text
                                      flex={1}
                                      color={textColor}
                                      textDecoration={todo.status.toLowerCase() === "done" ? "line-through" : "none"}
                                    >
                                      {todo.description}
                                    </Text>
                                    <Spacer />
                                    <IconButton
                                      icon={<EditIcon />}
                                      onClick={() => handleEditTodo(todo)}
                                      size="sm"
                                      colorScheme="teal"
                                      variant="ghost"
                                      mr={2}
                                      aria-label="Edit todo"
                                    />
                                    <IconButton
                                      icon={<DeleteIcon />}
                                      onClick={() => handleDeleteTodo(todo.id)}
                                      size="sm"
                                      colorScheme="red"
                                      variant="ghost"
                                      aria-label="Delete todo"
                                      isLoading={loading}
                                    />
                                  </>
                                )}
                              </Flex>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    );
                  })}
                </Box>
              </VStack>
            ) : (
              <VStack spacing={4} align="center" justify="center" height="100%">
                <Heading color={textColor} size="xl">Welcome to To Do App</Heading>
                <Text color={textColor}>Connect your wallet to start managing your to-dos</Text>
                <Button
                  size="lg"
                  colorScheme="blue"
                  onClick={connectWallet}
                >
                  Connect Wallet
                </Button>
              </VStack>
            )}
          </Container>
        </Box>
      </Flex>

      {/* Edit Todo Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color={textColor}>Edit To Do</ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody>
            <FormControl>
              <FormLabel color={textColor}>Description</FormLabel>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                color={textColor}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel color={textColor}>Priority</FormLabel>
              <Select
                value={todoPriority}
                onChange={(e) => setTodoPriority(e.target.value)}
                color={textColor}
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </FormControl>
            <FormControl mt={4}>
              <FormLabel color={textColor}>Status</FormLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                color={textColor}
              >
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSaveTodo}>
              Save
            </Button>
            <Button onClick={() => setIsOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
