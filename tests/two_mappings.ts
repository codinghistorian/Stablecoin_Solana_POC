import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TwoMappings } from "../target/types/two_mappings";

describe("two_mappings", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TwoMappings as Program<TwoMappings>;

  it("Initializing gloal state storage", async () => {
    const key = new anchor.BN(1);
    const seeds = [key.toArrayLike(Buffer, "le", 8)];
    const [globalStateAccount, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
      seeds,
      program.programId,
    );

    console.log("GlobalStateAccount is : " + globalStateAccount.toBase58());
    const tx = await program.methods.initialize(key).accounts({protocolStateAccount: globalStateAccount}).rpc();
    console.log("Your transaction signature", tx);
  });
});
