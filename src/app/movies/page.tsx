"use client";

import { Movie } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import type { ChangeEvent } from "react";

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [runtime, setRuntime] = useState("");
  const [releaseYear, setReleaseYear] = useState("");

  // Fetch movies from API
  const fetchMovies = useCallback(async () => {
    try {
      const res = await fetch("/api/movies");

      if (!res.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data: Movie[] = await res.json();

      setMovies(data);
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch movies when component mounts
  useEffect(() => {
    let cancelled = false;

    const loadMovies = async () => {
      try {
        const res = await fetch("/api/movies");

        if (!res.ok) {
          throw new Error("Failed to fetch movies");
        }

        const data: Movie[] = await res.json();

        if (!cancelled) {
          setMovies(data);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadMovies();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle form submission
  const handleAddMovie = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newMovie = {
      title,
      runtime: Number(runtime),
      releaseYear,
      prerequisites: [],
      watched: false,
    };

    try {
      setSubmitting(true);

      const res = await fetch("/api/movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMovie),
      });
      console.log("res", res);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);

        throw new Error(errorData?.error || "Failed to add movie");
      }

      // Reset form
      setTitle("");
      setRuntime("");
      setReleaseYear("");

      // Refresh movie list
      await fetchMovies();
    } catch (error) {
      console.error("Error adding movie:", error);

      alert(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading movies...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-green-400">Movies</h1>

      {/* Add Movie Form */}
      <form
        onSubmit={handleAddMovie}
        className="bg-gray-900 p-6 rounded-lg shadow-md flex gap-4 items-end"
      >
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-1">
            Movie Title
          </label>

          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
            placeholder="e.g. Iron Man"
          />
        </div>

        <div className="w-32">
          <label className="block text-sm text-gray-400 mb-1">
            Runtime (min)
          </label>

          <input
            type="number"
            required
            min="1"
            max="300"
            value={runtime}
            onChange={(e) => setRuntime(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>

        <div className="w-32">
          <label className="block text-sm text-gray-400 mb-1">
            Release Year
          </label>

          <input
            type="number"
            required
            value={releaseYear}
            onChange={(e) => setReleaseYear(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded transition"
        >
          {submitting ? "Adding..." : "Add Movie"}
        </button>
      </form>

      {/* Movie List */}
      <div className="space-y-4">
        {movies.length === 0 ? (
          <p className="text-gray-400">No movies found. Add one above!</p>
        ) : (
          movies.map((movie) => (
            <div
              key={movie.id}
              className="bg-gray-800 p-4 rounded-lg flex items-center justify-between"
            >
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {movie.title}
                </h3>

                <p className="text-sm text-gray-400">{movie.runtime} mins</p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="text-sm text-blue-400 hover:underline"
                >
                  Edit Prerequisites
                </button>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={movie.watched}
                    readOnly
                    className="w-5 h-5 accent-green-500 rounded"
                  />

                  <span className="text-gray-300">Watched</span>
                </label>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
