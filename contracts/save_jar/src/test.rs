#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::Env;

fn create_token<'a>(
    env: &Env,
    admin: &Address,
) -> (Address, token::StellarAssetClient<'a>, token::Client<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let address = sac.address();
    (
        address.clone(),
        token::StellarAssetClient::new(env, &address),
        token::Client::new(env, &address),
    )
}

#[test]
fn test_create_jar_and_deposit() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, token_admin, token) = create_token(&env, &admin);

    token_admin.mint(&owner, &1_000_i128);

    let target_date = env.ledger().timestamp() + 1000;
    let jar_id = client.create_jar(&owner, &asset, &UnlockType::DateOnly, &target_date, &0i128);
    assert_eq!(jar_id, 0);

    client.deposit(&jar_id, &owner, &200i128);

    let jar = client.get_jar(&jar_id);
    assert_eq!(jar.balance, 200);
    assert_eq!(jar.owner, owner);
    assert_eq!(token.balance(&contract_id), 200);
    assert_eq!(token.balance(&owner), 800);
}

#[test]
fn test_create_jar_rejects_past_date() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, _, _) = create_token(&env, &admin);

    let past_date = env.ledger().timestamp();
    let result = client.try_create_jar(&owner, &asset, &UnlockType::DateOnly, &past_date, &0i128);
    assert!(result.is_err());
}

#[test]
fn test_deposit_zero_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, _, _) = create_token(&env, &admin);

    let target_date = env.ledger().timestamp() + 1000;
    let jar_id = client.create_jar(&owner, &asset, &UnlockType::DateOnly, &target_date, &0i128);

    let result = client.try_deposit(&jar_id, &owner, &0i128);
    assert!(result.is_err());
}

#[test]
fn test_get_jar_not_found() {
    let env = Env::default();
    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let result = client.try_get_jar(&99u64);
    assert!(result.is_err());
}

#[test]
fn test_withdraw_after_unlock_date() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, token_admin, token) = create_token(&env, &admin);

    token_admin.mint(&owner, &1_000_i128);

    let target_date = env.ledger().timestamp() + 1000;
    let jar_id = client.create_jar(&owner, &asset, &UnlockType::DateOnly, &target_date, &0i128);
    client.deposit(&jar_id, &owner, &200i128);

    assert!(!client.is_unlocked(&jar_id));
    assert!(client.try_withdraw(&jar_id, &owner).is_err());

    env.ledger().set_timestamp(target_date);
    assert!(client.is_unlocked(&jar_id));

    client.withdraw(&jar_id, &owner);

    let jar = client.get_jar(&jar_id);
    assert!(jar.withdrawn);
    assert_eq!(jar.balance, 0);
    assert_eq!(token.balance(&owner), 1_000);
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
fn test_withdraw_not_owner_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let stranger = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, token_admin, _) = create_token(&env, &admin);
    token_admin.mint(&owner, &1_000_i128);

    let target_date = env.ledger().timestamp() + 1000;
    let jar_id = client.create_jar(&owner, &asset, &UnlockType::DateOnly, &target_date, &0i128);
    client.deposit(&jar_id, &owner, &200i128);

    env.ledger().set_timestamp(target_date);

    let result = client.try_withdraw(&jar_id, &stranger);
    assert!(result.is_err());
}

#[test]
fn test_double_withdraw_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, token_admin, _) = create_token(&env, &admin);
    token_admin.mint(&owner, &1_000_i128);

    let target_date = env.ledger().timestamp() + 1000;
    let jar_id = client.create_jar(&owner, &asset, &UnlockType::DateOnly, &target_date, &0i128);
    client.deposit(&jar_id, &owner, &200i128);

    env.ledger().set_timestamp(target_date);
    client.withdraw(&jar_id, &owner);

    let result = client.try_withdraw(&jar_id, &owner);
    assert!(result.is_err());
}

#[test]
fn test_goal_only_unlocks_on_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, token_admin, _) = create_token(&env, &admin);
    token_admin.mint(&owner, &1_000_i128);

    let jar_id = client.create_jar(&owner, &asset, &UnlockType::GoalOnly, &0u64, &500i128);

    client.deposit(&jar_id, &owner, &300i128);
    assert!(!client.is_unlocked(&jar_id));
    assert!(client.try_withdraw(&jar_id, &owner).is_err());

    client.deposit(&jar_id, &owner, &200i128);
    assert!(client.is_unlocked(&jar_id));

    client.withdraw(&jar_id, &owner);
    let jar = client.get_jar(&jar_id);
    assert!(jar.withdrawn);
}

#[test]
fn test_goal_only_unlocks_exactly_at_boundary() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, token_admin, _) = create_token(&env, &admin);
    token_admin.mint(&owner, &1_000_i128);

    let jar_id = client.create_jar(&owner, &asset, &UnlockType::GoalOnly, &0u64, &500i128);

    client.deposit(&jar_id, &owner, &499i128);
    assert!(
        !client.is_unlocked(&jar_id),
        "one unit short of the goal stays locked"
    );

    client.deposit(&jar_id, &owner, &1i128);
    assert!(
        client.is_unlocked(&jar_id),
        "balance exactly equal to target_amount unlocks"
    );
}

#[test]
fn test_create_jar_rejects_non_token_asset() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let not_a_token = Address::generate(&env);

    let target_date = env.ledger().timestamp() + 1000;
    let result = client.try_create_jar(
        &owner,
        &not_a_token,
        &UnlockType::DateOnly,
        &target_date,
        &0i128,
    );
    assert!(result.is_err());
}

#[test]
fn test_get_user_jars_tracks_multiple_jars() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let other = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, _, _) = create_token(&env, &admin);

    assert_eq!(client.get_user_jars(&owner).len(), 0);

    let target_date = env.ledger().timestamp() + 1000;
    let jar_a = client.create_jar(&owner, &asset, &UnlockType::DateOnly, &target_date, &0i128);
    let jar_b = client.create_jar(&owner, &asset, &UnlockType::GoalOnly, &0u64, &500i128);
    client.create_jar(&other, &asset, &UnlockType::DateOnly, &target_date, &0i128);

    let owner_jars = client.get_user_jars(&owner);
    assert_eq!(owner_jars.len(), 2);
    assert_eq!(owner_jars.get(0).unwrap(), jar_a);
    assert_eq!(owner_jars.get(1).unwrap(), jar_b);

    let other_jars = client.get_user_jars(&other);
    assert_eq!(other_jars.len(), 1);
}

#[test]
fn test_goal_only_rejects_zero_target_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, _, _) = create_token(&env, &admin);

    let result = client.try_create_jar(&owner, &asset, &UnlockType::GoalOnly, &0u64, &0i128);
    assert!(result.is_err());
}

#[test]
fn test_either_one_unlocks_on_first_condition_met() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, token_admin, _) = create_token(&env, &admin);
    token_admin.mint(&owner, &1_000_i128);

    let target_date = env.ledger().timestamp() + 1000;
    let jar_id = client.create_jar(
        &owner,
        &asset,
        &UnlockType::EitherOne,
        &target_date,
        &500i128,
    );

    client.deposit(&jar_id, &owner, &500i128);
    assert!(client.is_unlocked(&jar_id));
    client.withdraw(&jar_id, &owner);

    let jar = client.get_jar(&jar_id);
    assert!(jar.withdrawn);
}

#[test]
fn test_either_one_unlocks_on_date_before_goal_met() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, token_admin, _) = create_token(&env, &admin);
    token_admin.mint(&owner, &1_000_i128);

    let target_date = env.ledger().timestamp() + 1000;
    let jar_id = client.create_jar(
        &owner,
        &asset,
        &UnlockType::EitherOne,
        &target_date,
        &500i128,
    );

    client.deposit(&jar_id, &owner, &100i128);
    assert!(
        !client.is_unlocked(&jar_id),
        "neither date nor goal met yet"
    );

    env.ledger().set_timestamp(target_date);
    assert!(
        client.is_unlocked(&jar_id),
        "date reached even though goal is unmet"
    );
    client.withdraw(&jar_id, &owner);

    let jar = client.get_jar(&jar_id);
    assert!(jar.withdrawn);
}

#[test]
fn test_either_one_requires_both_targets_set() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, _, _) = create_token(&env, &admin);

    let target_date = env.ledger().timestamp() + 1000;
    let result =
        client.try_create_jar(&owner, &asset, &UnlockType::EitherOne, &target_date, &0i128);
    assert!(result.is_err());
}

#[test]
fn test_both_required_needs_date_and_goal() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, token_admin, _) = create_token(&env, &admin);
    token_admin.mint(&owner, &1_000_i128);

    let target_date = env.ledger().timestamp() + 1000;
    let jar_id = client.create_jar(
        &owner,
        &asset,
        &UnlockType::BothRequired,
        &target_date,
        &500i128,
    );

    client.deposit(&jar_id, &owner, &500i128);
    assert!(
        !client.is_unlocked(&jar_id),
        "goal met but date not yet reached"
    );
    assert!(client.try_withdraw(&jar_id, &owner).is_err());

    env.ledger().set_timestamp(target_date);
    assert!(client.is_unlocked(&jar_id), "both conditions now met");
    client.withdraw(&jar_id, &owner);

    let jar = client.get_jar(&jar_id);
    assert!(jar.withdrawn);
}

#[test]
fn test_both_required_date_met_goal_not_met_stays_locked() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, token_admin, _) = create_token(&env, &admin);
    token_admin.mint(&owner, &1_000_i128);

    let target_date = env.ledger().timestamp() + 1000;
    let jar_id = client.create_jar(
        &owner,
        &asset,
        &UnlockType::BothRequired,
        &target_date,
        &500i128,
    );

    client.deposit(&jar_id, &owner, &100i128);
    env.ledger().set_timestamp(target_date);

    assert!(!client.is_unlocked(&jar_id), "date met but goal not met");
    assert!(client.try_withdraw(&jar_id, &owner).is_err());
}

#[test]
fn test_both_required_rejects_missing_target_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, _, _) = create_token(&env, &admin);

    let target_date = env.ledger().timestamp() + 1000;
    let result = client.try_create_jar(
        &owner,
        &asset,
        &UnlockType::BothRequired,
        &target_date,
        &0i128,
    );
    assert!(result.is_err());
}

#[test]
fn test_deposit_into_nonexistent_jar_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let result = client.try_deposit(&99u64, &owner, &100i128);
    assert!(result.is_err());
}

#[test]
fn test_withdraw_nonexistent_jar_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let result = client.try_withdraw(&99u64, &owner);
    assert!(result.is_err());
}

#[test]
fn test_is_unlocked_nonexistent_jar_rejected() {
    let env = Env::default();
    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let result = client.try_is_unlocked(&99u64);
    assert!(result.is_err());
}

#[test]
fn test_deposit_allowed_from_non_owner() {
    // Deposits are permissionless by design (e.g. gifting into someone else's
    // jar) — only the jar's own auth (require_auth on `depositor`) is
    // checked, not ownership of the jar itself.
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let gifter = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, token_admin, token) = create_token(&env, &admin);
    token_admin.mint(&gifter, &1_000_i128);

    let target_date = env.ledger().timestamp() + 1000;
    let jar_id = client.create_jar(&owner, &asset, &UnlockType::DateOnly, &target_date, &0i128);

    client.deposit(&jar_id, &gifter, &300i128);

    let jar = client.get_jar(&jar_id);
    assert_eq!(jar.balance, 300);
    assert_eq!(token.balance(&gifter), 700);
    assert_eq!(token.balance(&contract_id), 300);
}

#[test]
fn test_deposit_after_withdrawal_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SaveJarContract, ());
    let client = SaveJarContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let admin = Address::generate(&env);
    let (asset, token_admin, _) = create_token(&env, &admin);
    token_admin.mint(&owner, &1_000_i128);

    let target_date = env.ledger().timestamp() + 1000;
    let jar_id = client.create_jar(&owner, &asset, &UnlockType::DateOnly, &target_date, &0i128);
    client.deposit(&jar_id, &owner, &200i128);

    env.ledger().set_timestamp(target_date);
    client.withdraw(&jar_id, &owner);

    let result = client.try_deposit(&jar_id, &owner, &50i128);
    assert!(result.is_err());
}
