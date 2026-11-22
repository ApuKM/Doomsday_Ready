export interface Movie {
  id: string;
  title: string;
  runtime: number;
  releaseYear: number;
  prerequisites: string[];
  watched: boolean;
}
