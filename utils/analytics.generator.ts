import { Document, Model } from "mongoose";
import { Request } from "express";
interface MonthData {
  month: string;
  count: number;
}
import Course from "../models/course.model";

export async function generateLast12MonthsData<T extends Document>(
  model: Model<T>,
  type: string,
  req?: Request
): Promise<{ last12Months: MonthData[] }> {
  const coursesCreatedByUser = await Course.find({ userId: req?.user?._id });
  const courseIds = coursesCreatedByUser.map(
    (course) => course._id
  ) as string[];
  const purchasedUsers = coursesCreatedByUser.flatMap(
    (course) => course.purchasedUsers
  );
  const filteredPurchaseUsers = [...new Set(purchasedUsers)];

  const last12Months: MonthData[] = [];

  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1);

  for (let i = 11; i >= 0; i--) {
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - i * 28
    );

    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - 28
    );

    const monthYear = endDate.toLocaleString("default", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const query =
      type === "course"
        ? {
            createdAt: {
              $gte: startDate,
              $lt: endDate,
            },
            userId: req?.user?._id,
          }
        : type === "order"
        ? {
            createdAt: {
              $gte: startDate,
              $lt: endDate,
            },
            courseId: { $in: courseIds },
          }
        : {
            createdAt: {
              $gte: startDate,
              $lt: endDate,
            },
            _id: { $in: filteredPurchaseUsers },
          };

    const count = await model.countDocuments(query);
    last12Months.push({ month: monthYear, count });
  }

  return { last12Months };
}
