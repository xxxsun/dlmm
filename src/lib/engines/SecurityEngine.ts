import { SecuritySignals } from "../types";

export class SecurityEngine {
  static analyzeToken(params: {
    mintAuthority: string | null;
    freezeAuthority: string | null;
    tokenProgram: string;
    isToken2022: boolean;
    extensions?: string[];
    holderTop10: number;
    holderTop20: number;
    liquidity: number;
    liquidityChange1h: number;
  }): SecuritySignals {
    const dangerous: string[] = [];
    const reasons: string[] = [];
    const rejectionReasons: string[] = [];

    if (params.isToken2022 && params.extensions) {
      for (const ext of params.extensions) {
        if (["transferHook","transferFee","permanentDelegate","confidentialTransfer","defaultAccountState"].includes(ext)) {
          dangerous.push(ext);
        }
      }
      if (dangerous.includes("permanentDelegate")) {
        reasons.push("Permanent delegate can move any tokens");
        rejectionReasons.push("Permanent delegate present");
      }
      if (dangerous.includes("transferHook")) reasons.push("Transfer hook may restrict sells");
    }

    if (params.mintAuthority) {
      reasons.push("Mint authority active - supply can be inflated");
    }
    if (params.freezeAuthority) {
      reasons.push("Freeze authority active - tokens can be frozen");
    }
    if (params.holderTop10 > 85) {
      reasons.push(`Top 10 holders control ${params.holderTop10.toFixed(1)}% (adjusted)`);
      rejectionReasons.push(`Extreme holder concentration ${params.holderTop10.toFixed(1)}%`);
    }
    if (params.liquidityChange1h < -70) {
      reasons.push(`Liquidity collapsed ${params.liquidityChange1h.toFixed(1)}% in 1h`);
      rejectionReasons.push("Severe liquidity withdrawal");
    }
    if (params.liquidity < 10000) {
      reasons.push("Extremely low liquidity");
      rejectionReasons.push("Extremely low liquidity");
    }

    // Security score 0-100 (higher is safer)
    let score = 100;
    if (params.mintAuthority) score -= 30;
    if (params.freezeAuthority) score -= 25;
    if (dangerous.length) score -= dangerous.length * 12;
    if (params.holderTop10 > 50) score -= (params.holderTop10 - 50) * 0.6;
    if (params.liquidityChange1h < -20) score -= Math.min(20, Math.abs(params.liquidityChange1h) * 0.3);
    score = Math.max(0, Math.min(100, score));

    const isRejected = rejectionReasons.length > 0 && (score < 30 || params.holderTop10 > 90 || params.liquidityChange1h < -70);

    return {
      mintAuthorityActive: !!params.mintAuthority,
      freezeAuthorityActive: !!params.freezeAuthority,
      tokenProgram: params.tokenProgram,
      isToken2022: params.isToken2022,
      token2022Extensions: params.extensions || [],
      dangerousExtensions: dangerous,
      holderTop5: params.holderTop10 * 0.6,
      holderTop10: params.holderTop10,
      holderTop20: params.holderTop20,
      adjustedHolderTop10: params.holderTop10,
      securityScore: Math.round(score),
      riskReasons: reasons,
      isRejected,
      rejectionReasons,
    };
  }

  static explainExtension(ext: string): string {
    const map: Record<string,string> = {
      transferFee: "Transfer fees take a cut on every transfer - can be up to 100% if malicious",
      transferHook: "Transfer hook executes custom program on transfers - may block sells",
      permanentDelegate: "Permanent delegate can burn/transfer any holder's tokens without approval",
      confidentialTransfer: "Confidential transfers hide amounts - complicates analysis",
      defaultAccountState: "Default frozen requires explicit approval to trade",
      mintCloseAuthority: "Allows closing mint - may be benign",
    };
    return map[ext] || `Extension ${ext} may increase risk - inspect implementation`;
  }
}
