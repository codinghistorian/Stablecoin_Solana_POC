import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TwoMappings } from "../target/types/two_mappings";

describe("Solana_stablecoin_POC", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TwoMappings as Program<TwoMappings>;

  it("Initializing gloal protocol storage", async () => {
    const key = new anchor.BN(1);
    const seeds = [key.toArrayLike(Buffer, "le", 8)];
    const [globalProtocolState, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
      seeds,
      program.programId,
    );

    console.log("ProtocolStateAccount is : " + globalProtocolState.toBase58());
    const tx = await program.methods.initialize(key).accounts({protocolStateAccount: globalProtocolState}).rpc();
    console.log("Your transaction signature", tx);
  });

  it("Open position counter", async () => {
    const provider = anchor.AnchorProvider.env();
    const signer = provider.wallet.publicKey;
    const seeds = [signer.toBuffer()];
    const [positionCounter, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
      seeds,
      program.programId,
    );

    console.log("Position counter for the `${signer}` is : " + positionCounter.toBase58());
    const tx = await program.methods.openPositionCounter().rpc();
    console.log("Your transaction signature", tx);
  });

  it("Open position", async () => {
    //check the value in the Protocol state account's total_position_count. It should be BN(0).
    const key0 = new anchor.BN(1);
    const seeds0 = [key0.toArrayLike(Buffer, "le", 8)];
    const [globalProtocolState, _bump0] = anchor.web3.PublicKey.findProgramAddressSync(
      seeds0,
      program.programId,
    );
    // console.log(program.account);
    let myGlobalProtocolState = await program.account.protocolState.fetch(globalProtocolState);
    console.log("The value of total_position_count is: ", myGlobalProtocolState.totalPositionCount);

    //check the value in the position counter's count. It should be BN(0).
    const provider = anchor.AnchorProvider.env();
    const signer = provider.wallet.publicKey;
    const seeds1 = [signer.toBuffer()];
    const [positionCounter, _bump1] = anchor.web3.PublicKey.findProgramAddressSync(
      seeds1,
      program.programId,
    );
    let positionCounter0 = await program.account.positionCounter.fetch(positionCounter);
    console.log("The value of positionCounter is: ", positionCounter0.count);
    //open position with collateral of some sol, and some stablecoin, no actual movement of SOL and token minting yet.
    const tx = await program.methods.openPosition(
      new anchor.BN(0) // col_type SOL as 0
    ).rpc();

    myGlobalProtocolState = await program.account.protocolState.fetch(globalProtocolState);
    console.log("The value of total_position_count after position open is: ", myGlobalProtocolState.totalPositionCount);
    positionCounter0 = await program.account.positionCounter.fetch(positionCounter);
    console.log("The value of positionCounter after position open is: ", positionCounter0.count);
    //check Position.col_type // Position.collateral_amount // Position.debt_amount to see all the number makes sense
    const colType = new anchor.BN(0);
    const updatedCount = positionCounter0.count.sub(new anchor.BN(1));
    const seeds2 = [
      colType.toArrayLike(Buffer, "le", 8),
      signer.toBuffer(),
      updatedCount.toArrayLike(Buffer, "le", 8),
    ];

    const [firstPositionAccount, _bump2] = anchor.web3.PublicKey.findProgramAddressSync(
      seeds2,
      program.programId,
    );
    let firstPositionState = await program.account.position.fetch(firstPositionAccount);
    console.log("Col type is : ",firstPositionState.colType);
    console.log("Col amount is : ",firstPositionState.collateralAmount);
    console.log("Debt amount is : ",firstPositionState.debtAmount);
    const tx0 = await program.methods.collateralizeAndBorrow(
      updatedCount,// position_counter_count BN(0)
      colType,// col_type BN(0)
      new anchor.BN(66),// col_amount
      new anchor.BN(33)// stablecoin_amount
    ).rpc();
    let firstPositionStateAfterOpenPosition = await program.account.position.fetch(firstPositionAccount);
    console.log("Col type is : ",firstPositionStateAfterOpenPosition.colType);
    console.log("Col amount is : ",firstPositionStateAfterOpenPosition.collateralAmount);
    console.log("Debt amount is : ",firstPositionStateAfterOpenPosition.debtAmount);
  
	});

});
