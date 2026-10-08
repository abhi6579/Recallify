import { listCustomerFeedback, submitCustomerFeedback } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const reviews = await listCustomerFeedback();
  const totalReviews = reviews.length;
  const avgRating = totalReviews
    ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) * 10) / 10
    : 5.0;

  return Response.json({ reviews, totalReviews, avgRating });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body?.userName || !body?.whatUnderstood) {
    return Response.json(
      { error: "Name and 'What did you understand?' are required." },
      { status: 400 }
    );
  }

  const feedback = await submitCustomerFeedback({
    userName: body.userName,
    userRole: body.userRole,
    careerField: body.careerField,
    rating: Number(body.rating) || 5,
    whatUnderstood: body.whatUnderstood,
    whatLacking: body.whatLacking,
    favoriteFeature: body.favoriteFeature,
  });

  return Response.json({ feedback }, { status: 201 });
}
