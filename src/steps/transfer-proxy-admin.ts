import ProxyAdmin from '@openzeppelin/contracts/build/contracts/ProxyAdmin.json'
import { Contract } from '@ethersproject/contracts'
import { MigrationStep } from '../migrations'

export const TRANSFER_PROXY_ADMIN: MigrationStep = async (state, config) => {
  if (state.proxyAdminAddress === undefined) {
    throw new Error('Missing ProxyAdmin')
  }
  let { signer, gasPrice, ownerAddress } = config

  // if wormhole is enabled, the owner should be the WH receiver address
  if (config.wormhole.enabled) {
    if (state.wormholeReceiverAddress === undefined) {
      throw new Error('Missing Wormhole Receiver')
    }
    ownerAddress = state.wormholeReceiverAddress
  }

  const proxyAdmin = new Contract(state.proxyAdminAddress, ProxyAdmin.abi, signer)

  const owner = await proxyAdmin.owner()
  if (owner === ownerAddress)
    return [
      {
        message: `ProxyAdmin owned by ${ownerAddress} already`,
      },
    ]

  if (owner !== (await signer.getAddress())) {
    throw new Error('ProxyAdmin.owner is not signer')
  }

  const tx = await proxyAdmin.transferOwnership(ownerAddress, { gasPrice })

  return [
    {
      message: `ProxyAdmin ownership set to ${ownerAddress}`,
      hash: tx.hash,
    },
  ]
}
