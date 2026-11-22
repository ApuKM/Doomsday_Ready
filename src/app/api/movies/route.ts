import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { Movie } from "@/lib/types";

export async function GET() {
  try {
    const movies = await prisma.movie.findMany();
    return NextResponse.json(movies, { status: 200 });
  } catch (error) {
    console.error("Error fetching movies:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: Movie = await request.json();
    const {
      title,
      releaseYear,
      runtime,
      prerequisites = [],
      watched = false,
    } = data;


    // 1. Basic Validation
    if (runtime < 1 || runtime > 300) {
      return NextResponse.json(
        { error: "Runtime must be between 1 and 300 minutes." },
        { status: 400 },
      );
    }

    // 2. Fetch current graph state
    const allMovies = await prisma.movie.findMany({
      select: {
        id: true,
        prerequisites: { select: { id: true } },
      },
    });

    // TypeScript: Map-এর Type নির্দিষ্ট করে দেওয়া হলো
    const movieGraph = new Map<string, string[]>();

    allMovies.forEach((movie) => {
      movieGraph.set(
        movie.id,
        movie.prerequisites.map((p) => p.id),
      );
    });

    const candidateId = "NEW_MOVIE_TEMP_ID";
    movieGraph.set(candidateId, prerequisites);

    // 3. Cycle Detection Logic
    function hasCycle(startNodeId: string) {
      const state = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited

      function dfs(nodeId: string): boolean {
        const currentState = state.get(nodeId) || 0;
        if (currentState === 1) return true; // Cycle Detected!
        if (currentState === 2) return false;

        state.set(nodeId, 1); // Mark as visiting

        const prereqs = movieGraph.get(nodeId) || [];
        for (const prereqId of prereqs) {
          if (dfs(prereqId)) return true;
        }

        state.set(nodeId, 2); // Mark as safe
        return false;
      }

      return dfs(startNodeId);
    }

    // আমাদের নতুন মুভি দিয়ে চেক শুরু করি
    if (hasCycle(candidateId)) {
      return NextResponse.json(
        { error: "CIRCULAR_DEPENDENCY" },
        { status: 409 },
      );
    }

    // 4. Save safely to Database
    const newMovie = await prisma.movie.create({
      data: {
        title,
        releaseYear: Number(releaseYear),
        runtime,
        watched,
        prerequisites: {
          connect: prerequisites.map((id: string) => ({ id })),
        },
      },
      include: {
        prerequisites: true,
      },
    });

    // শুধুমাত্র একবার রিটার্ন করা হলো
    return NextResponse.json(newMovie, { status: 201 });
  } catch (error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A movie with this title already exists." },
        { status: 409 }
      );
    }
  }

  console.error(
    "Error creating movie:",
    error instanceof Error ? error.message : error
  );

  return NextResponse.json(
    { error: "Failed to create movie" },
    { status: 500 }
  );
}
}
