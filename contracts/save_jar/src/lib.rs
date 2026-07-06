#![no_std]
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env, Vec,
};

mod test;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub enum UnlockType {
    DateOnly,
    GoalOnly,
    EitherOne,
    BothRequired,
}

#[contracttype]
#[derive(Clone)]
pub struct JarData {
    pub owner: Address,
    pub asset: Address,
    pub balance: i128,
    pub unlock_type: UnlockType,
    pub target_date: u64,
    pub target_amount: i128,
    pub created_at: u64,
    pub withdrawn: bool,
}

#[contracttype]
enum DataKey {
    Jar(u64),
    JarCounter,
    UserJars(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    /// `target_date`/`target_amount` don't satisfy the chosen `UnlockType`,
    /// or `asset` isn't a valid SEP-41 token.
    InvalidConfig = 1,
    /// No jar exists for the given id.
    JarNotFound = 2,
    /// `deposit` was called with an amount <= 0.
    ZeroDeposit = 3,
    /// `withdraw` was called by an address other than the jar's owner.
    NotOwner = 4,
    /// `withdraw` or `deposit` was called on a jar that's already been
    /// withdrawn (withdrawal is one-time and all-or-nothing).
    AlreadyWithdrawn = 5,
    /// `withdraw` was called before the unlock condition was met.
    StillLocked = 6,
}

#[contractevent(topics = ["jar_created"])]
pub struct JarCreated {
    #[topic]
    pub jar_id: u64,
    pub owner: Address,
    pub asset: Address,
    pub target_date: u64,
    pub target_amount: i128,
}

#[contractevent(topics = ["deposit_made"])]
pub struct DepositMade {
    #[topic]
    pub jar_id: u64,
    pub depositor: Address,
    pub amount: i128,
    pub new_balance: i128,
}

#[contractevent(topics = ["jar_withdrawn"])]
pub struct JarWithdrawn {
    #[topic]
    pub jar_id: u64,
    pub owner: Address,
    pub amount: i128,
}

#[contract]
pub struct SaveJarContract;

#[contractimpl]
impl SaveJarContract {
    /// Create a new jar owned by `owner`, holding `asset` (a SEP-41 token),
    /// unlockable per `unlock_type`. Requires `owner`'s authorization.
    ///
    /// `target_date` must be in the future for `DateOnly`/`EitherOne`/
    /// `BothRequired`; `target_amount` must be > 0 for `GoalOnly`/
    /// `EitherOne`/`BothRequired`. Returns the new jar's id.
    pub fn create_jar(
        env: Env,
        owner: Address,
        asset: Address,
        unlock_type: UnlockType,
        target_date: u64,
        target_amount: i128,
    ) -> Result<u64, Error> {
        owner.require_auth();

        let now = env.ledger().timestamp();
        let date_valid = target_date > now;
        let amount_valid = target_amount > 0;
        match unlock_type {
            UnlockType::DateOnly => {
                if !date_valid {
                    return Err(Error::InvalidConfig);
                }
            }
            UnlockType::GoalOnly => {
                if !amount_valid {
                    return Err(Error::InvalidConfig);
                }
            }
            UnlockType::EitherOne | UnlockType::BothRequired => {
                if !date_valid || !amount_valid {
                    return Err(Error::InvalidConfig);
                }
            }
        }

        let token_client = token::TokenClient::new(&env, &asset);
        if token_client.try_decimals().is_err() {
            return Err(Error::InvalidConfig);
        }

        let counter_key = DataKey::JarCounter;
        let jar_id: u64 = env.storage().instance().get(&counter_key).unwrap_or(0u64);
        let next_id = jar_id + 1;
        env.storage().instance().set(&counter_key, &next_id);

        let jar = JarData {
            owner: owner.clone(),
            asset,
            balance: 0,
            unlock_type,
            target_date,
            target_amount,
            created_at: env.ledger().timestamp(),
            withdrawn: false,
        };
        env.storage().persistent().set(&DataKey::Jar(jar_id), &jar);

        let user_jars_key = DataKey::UserJars(jar.owner.clone());
        let mut user_jars: Vec<u64> = env
            .storage()
            .persistent()
            .get(&user_jars_key)
            .unwrap_or(Vec::new(&env));
        user_jars.push_back(jar_id);
        env.storage().persistent().set(&user_jars_key, &user_jars);

        JarCreated {
            jar_id,
            owner,
            asset: jar.asset.clone(),
            target_date,
            target_amount,
        }
        .publish(&env);

        Ok(jar_id)
    }

    /// Deposit `amount` of the jar's asset from `depositor` into jar
    /// `jar_id`. Requires `depositor`'s authorization but *not* jar
    /// ownership — anyone may top up any jar (e.g. to gift savings).
    /// Fails if the jar doesn't exist, is already withdrawn, or
    /// `amount <= 0`.
    pub fn deposit(env: Env, jar_id: u64, depositor: Address, amount: i128) -> Result<(), Error> {
        depositor.require_auth();

        if amount <= 0 {
            return Err(Error::ZeroDeposit);
        }

        let mut jar: JarData = env
            .storage()
            .persistent()
            .get(&DataKey::Jar(jar_id))
            .ok_or(Error::JarNotFound)?;

        if jar.withdrawn {
            return Err(Error::AlreadyWithdrawn);
        }

        let token_client = token::TokenClient::new(&env, &jar.asset);
        token_client.transfer(&depositor, env.current_contract_address(), &amount);

        jar.balance += amount;
        env.storage().persistent().set(&DataKey::Jar(jar_id), &jar);

        DepositMade {
            jar_id,
            depositor,
            amount,
            new_balance: jar.balance,
        }
        .publish(&env);

        Ok(())
    }

    /// Withdraw the full balance of jar `jar_id` to its owner. Requires
    /// `caller`'s authorization and that `caller` is the jar's owner, that
    /// the unlock condition is met, and that the jar hasn't already been
    /// withdrawn. Withdrawal is one-time and all-or-nothing — there is no
    /// partial withdrawal.
    pub fn withdraw(env: Env, jar_id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();

        let mut jar: JarData = env
            .storage()
            .persistent()
            .get(&DataKey::Jar(jar_id))
            .ok_or(Error::JarNotFound)?;

        if caller != jar.owner {
            return Err(Error::NotOwner);
        }
        if jar.withdrawn {
            return Err(Error::AlreadyWithdrawn);
        }
        if !Self::check_unlock_condition(&env, &jar) {
            return Err(Error::StillLocked);
        }

        let amount = jar.balance;
        let token_client = token::TokenClient::new(&env, &jar.asset);
        token_client.transfer(&env.current_contract_address(), &jar.owner, &amount);

        jar.withdrawn = true;
        jar.balance = 0;
        env.storage().persistent().set(&DataKey::Jar(jar_id), &jar);

        JarWithdrawn {
            jar_id,
            owner: jar.owner,
            amount,
        }
        .publish(&env);

        Ok(())
    }

    /// Read-only lookup of a jar's full state by id.
    pub fn get_jar(env: Env, jar_id: u64) -> Result<JarData, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Jar(jar_id))
            .ok_or(Error::JarNotFound)
    }

    /// Read-only list of jar ids created by `owner`, in creation order.
    pub fn get_user_jars(env: Env, owner: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::UserJars(owner))
            .unwrap_or(Vec::new(&env))
    }

    /// Read-only check of whether jar `jar_id`'s unlock condition is
    /// currently met (independent of whether it's already withdrawn).
    pub fn is_unlocked(env: Env, jar_id: u64) -> Result<bool, Error> {
        let jar: JarData = env
            .storage()
            .persistent()
            .get(&DataKey::Jar(jar_id))
            .ok_or(Error::JarNotFound)?;
        Ok(Self::check_unlock_condition(&env, &jar))
    }

    fn check_unlock_condition(env: &Env, jar: &JarData) -> bool {
        let date_met = jar.target_date > 0 && env.ledger().timestamp() >= jar.target_date;
        let goal_met = jar.target_amount > 0 && jar.balance >= jar.target_amount;
        match jar.unlock_type {
            UnlockType::DateOnly => date_met,
            UnlockType::GoalOnly => goal_met,
            UnlockType::EitherOne => date_met || goal_met,
            UnlockType::BothRequired => date_met && goal_met,
        }
    }
}
