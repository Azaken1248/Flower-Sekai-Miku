"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrikeService = void 0;
class StrikeService {
    strikeRepository;
    userRepository;
    logger;
    constructor(strikeRepository, userRepository, logger) {
        this.strikeRepository = strikeRepository;
        this.userRepository = userRepository;
        this.logger = logger;
    }
    async addStrike(targetDiscordId, issuedBy, reason, detail) {
        const user = await this.userRepository.findByDiscordId(targetDiscordId);
        if (!user) {
            return { status: "notFound", newStrikeCount: 0 };
        }
        if (user.isDeboarded) {
            return { status: "deboarded", newStrikeCount: user.strikes };
        }
        if (user.strikes >= 3) {
            return { status: "maxStrikes", newStrikeCount: user.strikes };
        }
        const strike = await this.strikeRepository.create({
            discordUserId: targetDiscordId,
            issuedBy,
            reason,
            detail: detail ?? null,
        });
        const updatedUser = await this.userRepository.incrementStrikes(targetDiscordId, 1);
        const newCount = updatedUser?.strikes ?? user.strikes + 1;
        this.logger.info("Strike added.", {
            discordUserId: targetDiscordId,
            issuedBy,
            reason,
            detail: detail ?? null,
            newStrikeCount: newCount,
        });
        return { status: "added", strike, newStrikeCount: newCount };
    }
    async removeStrike(strikeId) {
        const strike = await this.strikeRepository.findById(strikeId);
        if (!strike) {
            return { status: "strikeNotFound", newStrikeCount: 0 };
        }
        const user = await this.userRepository.findByDiscordId(strike.discordUserId);
        if (!user) {
            return { status: "userNotFound", newStrikeCount: 0 };
        }
        await this.strikeRepository.deleteById(strikeId);
        const updatedUser = await this.userRepository.incrementStrikes(strike.discordUserId, -1);
        const newCount = updatedUser?.strikes ?? Math.max(0, user.strikes - 1);
        this.logger.info("Strike removed.", {
            strikeId,
            discordUserId: strike.discordUserId,
            newStrikeCount: newCount,
        });
        return { status: "removed", newStrikeCount: newCount };
    }
    async fileAppeal(strikeId, discordUserId, appealReason) {
        const strike = await this.strikeRepository.findById(strikeId);
        if (!strike) {
            return { status: "strikeNotFound" };
        }
        if (strike.discordUserId !== discordUserId) {
            return { status: "notOwner" };
        }
        if (strike.appealStatus === "pending") {
            return { status: "alreadyPending", strike };
        }
        if (strike.appealStatus === "accepted" || strike.appealStatus === "denied") {
            return { status: "alreadyResolved", strike };
        }
        const updatedStrike = await this.strikeRepository.updateAppealStatus(strikeId, "pending", appealReason, null);
        this.logger.info("Strike appeal filed.", {
            strikeId,
            discordUserId,
            appealReason,
        });
        return { status: "filed", strike: updatedStrike ?? strike };
    }
    async resolveAppeal(strikeId, resolvedBy, accepted) {
        const strike = await this.strikeRepository.findById(strikeId);
        if (!strike) {
            return { status: "strikeNotFound", newStrikeCount: 0 };
        }
        if (strike.appealStatus !== "pending") {
            return { status: "notPending", newStrikeCount: 0 };
        }
        if (accepted) {
            await this.strikeRepository.updateAppealStatus(strikeId, "accepted", null, resolvedBy);
            const removeResult = await this.removeStrike(strikeId);
            this.logger.info("Strike appeal accepted — strike removed.", {
                strikeId,
                resolvedBy,
            });
            return { status: "accepted", strike, newStrikeCount: removeResult.newStrikeCount };
        }
        const updatedStrike = await this.strikeRepository.updateAppealStatus(strikeId, "denied", null, resolvedBy);
        this.logger.info("Strike appeal denied.", {
            strikeId,
            resolvedBy,
        });
        const user = await this.userRepository.findByDiscordId(strike.discordUserId);
        return {
            status: "denied",
            strike: updatedStrike ?? strike,
            newStrikeCount: user?.strikes ?? 0,
        };
    }
    async getStrikesForUser(discordUserId) {
        return this.strikeRepository.findByDiscordUserId(discordUserId);
    }
    async getAllStrikes() {
        return this.strikeRepository.findAll();
    }
}
exports.StrikeService = StrikeService;
