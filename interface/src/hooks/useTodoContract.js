import { useCallback, useState } from 'react';
import { useAccount, useCosmWasmClient } from "graz";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { CONTRACT_ADDRESS } from '../chain';
import { GasPrice } from "@cosmjs/stargate";


export function useTodoContract() {
  const { data: account } = useAccount();
  const { data: cosmWasmClient } = useCosmWasmClient();
  const [loading, setLoading] = useState(false);

  const fetchTodos = useCallback(async () => {
    if (!cosmWasmClient) return [];
    setLoading(true);
    const result = await cosmWasmClient.queryContractSmart(CONTRACT_ADDRESS, { query_list: {} });
    setLoading(false);
    return result.entries;
  }, [cosmWasmClient]);

  const getSigningClient = useCallback(async () => {
    if (!window.keplr) throw new Error("Keplr not found");
    await window.keplr.enable("mantra-hongbai-1");
    const offlineSigner = window.keplr.getOfflineSigner("mantra-hongbai-1");
    const gasPrice = GasPrice.fromString('0.025uaum');
    return await SigningCosmWasmClient.connectWithSigner("https://rpc.hongbai.mantrachain.io", offlineSigner, { gasPrice });
  }, []);

  const addTodo = useCallback(async (description, priority, owner = account.bech32Address.toString()) => {
    if (!account) return;
    setLoading(true);
    console.log(description, priority);
    const signingClient = await getSigningClient();
    await signingClient.execute(
      account.bech32Address,
      CONTRACT_ADDRESS,
      { new_entry: { description, priority, owner } },
      "auto"
    );
    setLoading(false);
  }, [account, getSigningClient]);

  const updateTodo = useCallback(async (id, description, status, priority, owner = account.bech32Address.toString()) => {
    if (!account) return;
    setLoading(true);
    const signingClient = await getSigningClient();
    await signingClient.execute(
      account.bech32Address,
      CONTRACT_ADDRESS,
      { update_entry: { id, description, status, priority, owner } },
      "auto"
    );
    setLoading(false);
  }, [account, getSigningClient]);

  const deleteTodo = useCallback(async (id, owner = account.bech32Address.toString()) => {
    if (!account) return;
    setLoading(true);
    const signingClient = await getSigningClient();
    await signingClient.execute(
      account.bech32Address,
      CONTRACT_ADDRESS,
      { delete_entry: { id, owner } },
      "auto"
    );
    setLoading(false);
  }, [account, getSigningClient]);

  return { fetchTodos, addTodo, updateTodo, deleteTodo, loading, setLoading };
}