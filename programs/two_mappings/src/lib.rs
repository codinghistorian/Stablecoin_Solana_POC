use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("bfT4FJ1TNVSabtsiWyauDRefXZWxiuh8g93yiDzkf6B");

#[program]
pub mod two_mappings {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, key: u64) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn open_position_counter(ctx: Context<PositionCounterInit>) -> Result<()> {
        Ok(())
    }

    pub fn open_position(ctx: Context<OpenPosition>, col_type: u64) -> Result<()> {
        ctx.accounts.position_counter.count = ctx.accounts.position_counter.count + 1;
        ctx.accounts.protocol_state_account.total_position_count = ctx.accounts.protocol_state_account.total_position_count + 1;
        Ok(())
    }

    pub fn collateralize_and_borrow(ctx: Context<CDPAction>, position_counter_count: u64, col_type: u64, col_amount: u64, stablecoin_amount: u64) -> Result<()> {
        //TODO add require! that the positionCounter account exist for the signer
        //TODO add transfer of lamports via systemProgram from the signer to this or some other account
        //TODO add mint of stablecoin token to the signer
        let position = &mut ctx.accounts.position;
        position.col_type = col_type;
        position.collateral_amount = col_amount;
        //TODO debt_amount should not be 1:1 to stablecoin amount, later to be fixed
        position.debt_amount = stablecoin_amount;
        Ok(())
    }

    //TODO Need to make a fn that will close position Account totally and deallocate rent exempt lamports.

}


#[derive(Accounts)]
#[instruction(key: u64)]
pub struct Initialize<'info> {
    #[account(init,
        payer = signer,
        space = size_of::<ProtocolState>() + 8,
        seeds=[&key.to_le_bytes().as_ref()],
        bump)]
    protocol_state_account: Account<'info, ProtocolState>,

    #[account(mut)]
    signer: Signer<'info>,
    
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(col_type: u64)]
pub struct OpenPosition<'info> {
    #[account(init,
        payer = signer,
        space = size_of::<Position>() + 8,
        seeds=[
            &col_type.to_le_bytes().as_ref(), 
            &signer.key.to_bytes().as_ref(),
            &position_counter.count.to_le_bytes().as_ref(),
        ],
        bump)]
    position: Account<'info, Position>,

    #[account(mut)]
    protocol_state_account: Account<'info, ProtocolState>,

    #[account(mut)]
    signer: Signer<'info>,

    #[account(mut)]
    position_counter: Account<'info, PositionCounter>,

    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(position_counter_count: u64, col_type: u64, col_amount: u64, stablecoin_amount: u64)]
pub struct CDPAction<'info> {
    #[account(mut, seeds = [
        &col_type.to_le_bytes().as_ref(), 
        &signer.key.to_bytes().as_ref(),
        &position_counter_count.to_le_bytes().as_ref()
    ], bump)]
    position: Account<'info, Position>,

    #[account(mut)]
    signer: Signer<'info>,

    // system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PositionCounterInit<'info> {
    #[account(init,
        payer = signer,
        space = size_of::<Position>() + 8,
        seeds=[
            &signer.key.to_bytes().as_ref()        
        ],
        bump)]
    position_counter: Account<'info, PositionCounter>,

    #[account(mut)]
    signer: Signer<'info>,

    system_program: Program<'info, System>,
}

#[account]
pub struct Position {
    col_type: u64,
    collateral_amount: u64,
    debt_amount: u64,
}

#[account]
pub struct ProtocolState {
    total_position_count: u64,
    //let's make the protocol state have the key of 1, little endian
}

#[account]
pub struct PositionCounter {
    count: u64,
}

//TODO I need to come up with a way to store which position of a signer is open or not open. 