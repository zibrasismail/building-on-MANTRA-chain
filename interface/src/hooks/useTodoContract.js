import { useCallback, useState } from "react";
import { useAccount, useCosmWasmClient } from "graz";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { CONTRACT_ADDRESS } from "../chain";
import { GasPrice } from "@cosmjs/stargate";

export function useTodoContract() {
  const { data: account } = useAccount();
  const { data: cosmWasmClient } = useCosmWasmClient();
  const [loading, setLoading] = useState(false);

  // Fetch todos with improved error handling
  const fetchTodos = useCallback(async () => {
    if (!cosmWasmClient || !account) return [];
    setLoading(true);
    try {
      const result = await cosmWasmClient.queryContractSmart(CONTRACT_ADDRESS, {
        query_user_list: { user: account.bech32Address.toString() },
      });
      return result.entries || [];
    } catch (error) {
      console.error("Error fetching todos:", error.message || error);
      alert("Error fetching todos. Please try again.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [cosmWasmClient, account]);

  // Get signing client with better error handling
  const getSigningClient = useCallback(async () => {
    if (!window.keplr) throw new Error("Keplr not found");
    await window.keplr.enable("mantra-hongbai-1");
    const offlineSigner = window.keplr.getOfflineSigner("mantra-hongbai-1");
    const gasPrice = GasPrice.fromString("0.025uaum");
    return await SigningCosmWasmClient.connectWithSigner(
      "https://rpc.hongbai.mantrachain.io",
      offlineSigner,
      { gasPrice }
    );
  }, []);

  // Add todo with error handling
  // Add todo with error handling
  // Add todo with error handling
  const addTodo = useCallback(
    async (description, priority) => {
      if (!account) {
        alert("Account is not defined. Please connect your wallet.");
        return;
      }

      const owner = account.bech32Address?.toString();

      setLoading(true);
      try {
        const signingClient = await getSigningClient();

        if (!signingClient) {
          throw new Error("Failed to get signing client.");
        }

        const response = await signingClient.execute(
          owner,
          CONTRACT_ADDRESS,
          { new_entry: { description, priority, owner } },
          "auto"
        );
        console.log("Add response:", response);
        await fetchTodos(); // Refresh todos after adding
        window.location.reload(); // Reload the page after refreshing todos
      } catch (error) {
        console.error("Error adding todo:", error.message || error);
        alert("Error adding todo. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [account, getSigningClient, fetchTodos]
  );

  // Update todo with better error handling
  const updateTodo = useCallback(
    async (
      id,
      description,
      status,
      priority,
      owner = account.bech32Address.toString()
    ) => {
      if (!account || !id) return;
      setLoading(true);
      try {
        const signingClient = await getSigningClient();
        const updateParams = {
          id,
          description: description || null,
          status: status || null,
          priority: priority || null,
          owner,
        };

        console.log("Updating todo with parameters:", updateParams);

        const response = await signingClient.execute(
          account.bech32Address,
          CONTRACT_ADDRESS,
          { update_entry: updateParams },
          "auto"
        );
        console.log("Update response:", response);

        // Fetch todos again to ensure updated data is shown
        await fetchTodos();
      } catch (error) {
        console.error("Error updating todo:", error.message || error);
        alert("Error updating todo. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [account, getSigningClient, fetchTodos]
  );

  // Delete todo with error handling
  const deleteTodo = useCallback(
    async (id, owner = account.bech32Address.toString()) => {
      if (!account || !id) return;
      setLoading(true);
      try {
        const signingClient = await getSigningClient();
        const response = await signingClient.execute(
          account.bech32Address,
          CONTRACT_ADDRESS,
          { delete_entry: { id, owner } },
          "auto"
        );
        console.log("Delete response:", response);

        // Fetch todos again to ensure updated data is shown
        await fetchTodos();
      } catch (error) {
        console.error("Error deleting todo:", error.message || error);
        alert("Error deleting todo. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [account, getSigningClient, fetchTodos]
  );

  return { fetchTodos, addTodo, updateTodo, deleteTodo, loading, setLoading };
}
