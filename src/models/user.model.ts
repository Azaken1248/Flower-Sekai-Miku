import { type Document, type Model, model, models, Schema, Types } from "mongoose";

export interface IUser extends Document {
  discordId: string;
  username: string;
  strikes: number;
  isOnHiatus: boolean;
  isDeboarded: boolean;
  deboardedAt: Date | null;
  deboardedMessage: string;
  joinedAt: Date;
  assignments: Types.ObjectId[];
}

const UserSchema = new Schema<IUser>({
  discordId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  strikes: { type: Number, default: 0, min: 0, max: 3 },
  isOnHiatus: { type: Boolean, default: false },
  isDeboarded: { type: Boolean, default: false },
  deboardedAt: { type: Date, default: null },
  deboardedMessage: { type: String, default: "Moved to a different team" },
  joinedAt: { type: Date, default: Date.now },
  assignments: [{ type: Schema.Types.ObjectId, ref: "Assignment" }],
});

export const UserModel: Model<IUser> =
  (models.User as Model<IUser> | undefined) ?? model<IUser>("User", UserSchema);
