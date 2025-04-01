import { MultiAddress } from "@polkadot-api/descriptors";
import {
  getDynamicBuilder,
  getLookupFn,
  MetadataLookup,
} from "@polkadot-api/metadata-builders";
import type { PolkadotSigner } from "@polkadot-api/polkadot-signer";
import { decAnyMetadata, SS58String } from "@polkadot-api/substrate-bindings";
import { mergeUint8 } from "@polkadot-api/utils";
import { TxCallData } from "polkadot-api";

export function getProxySigner(
  real: SS58String,
  signer: PolkadotSigner
): PolkadotSigner {
  return {
    publicKey: signer.publicKey,
    signBytes() {
      throw new Error("Raw bytes can't be signed with a proxy");
    },
    async signTx(callData, signedExtensions, metadata, atBlockNumber, hasher) {
      const lookup = metadataToLookup(metadata);

      // Function to decode a binary call data to the Enum JSON representation
      const callDecoder = createCallDecoder(lookup);

      // Function to create a Proxy.proxy call (equivalent to tx.Proxy.proxy({…}).getEncodedData())
      const txProxyProxy = createProxyProxy(lookup);

      // TODO
    },
  };
}

function createProxyProxy(lookup: MetadataLookup) {
  const { location, codec } = getDynamicBuilder(lookup).buildCall(
    "Proxy",
    "proxy"
  );

  return (data: { real: MultiAddress; call: TxCallData }) => {
    try {
      return mergeUint8(new Uint8Array(location), codec.enc(data));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      throw new Error(
        `Unsupported runtime version: Proxy.proxy not present or changed substantially`
      );
    }
  };
}

function createCallDecoder(lookup: MetadataLookup) {
  const callCodec = getDynamicBuilder(lookup).buildDefinition(lookup.call!);

  return (call: Uint8Array<ArrayBufferLike>): TxCallData => callCodec.dec(call);
}

const metadataToLookup = (
  metadata: Uint8Array<ArrayBufferLike>
): MetadataLookup => {
  const tmpMeta = decAnyMetadata(metadata).metadata;
  if (tmpMeta.tag !== "v14" && tmpMeta.tag !== "v15") {
    throw new Error("Unsupported metadata version");
  }
  return getLookupFn(tmpMeta.value);
};
