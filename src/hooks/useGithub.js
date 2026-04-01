import { useState, useCallback } from 'react';
import { Octokit } from 'octokit';

/**
 * Custom React hook for GitHub API operations
 * Handles file fetching, updating, and repository operations via Octokit
 * 
 * @param {string} token - GitHub Personal Access Token
 * @returns {Object} GitHub API utility functions
 */
export function useGithub(token) {
  const [octokit] = useState(() => new Octokit({ auth: token }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch file content and metadata from GitHub
   */
  const getFileContent = useCallback(async (owner, repo, path, ref = 'main') => {
    setLoading(true);
    setError(null);
    try {
      const response = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref
      });

      // GitHub API returns Base64 encoded content
      const content = atob(response.data.content);
      
      return {
        content,
        sha: response.data.sha,
        size: response.data.size,
        url: response.data.url,
        htmlUrl: response.data.html_url
      };
    } catch (err) {
      setError(err.message);
      console.error('Error fetching file:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [octokit]);

  /**
   * Update file content on GitHub
   * Requires current SHA to prevent conflicts
   */
  const updateFileContent = useCallback(async (owner, repo, path, content, sha, message) => {
    setLoading(true);
    setError(null);
    try {
      // Encode content to Base64 for GitHub API
      const encodedContent = btoa(unescape(encodeURIComponent(content)));

      const response = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: message || `Update ${path}`,
        content: encodedContent,
        sha
      });

      return {
        commit: response.data.commit,
        content: response.data.content
      };
    } catch (err) {
      setError(err.message);
      console.error('Error updating file:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [octokit]);

  /**
   * Get repository tree structure
   */
  const getRepoTree = useCallback(async (owner, repo, ref = 'main') => {
    setLoading(true);
    setError(null);
    try {
      const response = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: ref,
        recursive: '1'
      });

      return response.data.tree;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tree:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [octokit]);

  /**
   * Get repository information
   */
  const getRepoInfo = useCallback(async (owner, repo) => {
    setLoading(true);
    setError(null);
    try {
      const response = await octokit.rest.repos.get({
        owner,
        repo
      });

      return {
        name: response.data.name,
        fullName: response.data.full_name,
        defaultBranch: response.data.default_branch,
        private: response.data.private,
        description: response.data.description
      };
    } catch (err) {
      setError(err.message);
      console.error('Error fetching repo info:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [octokit]);

  /**
   * List user's repositories
   */
  const listRepos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100
      });

      return response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at
      }));
    } catch (err) {
      setError(err.message);
      console.error('Error listing repos:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [octokit]);

  /**
   * Create a new repository
   */
  const createRepo = useCallback(async (name, description, isPrivate = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await octokit.rest.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: true // Initialize with README
      });

      const repoData = {
        id: response.data.id,
        name: response.data.name,
        fullName: response.data.full_name,
        owner: response.data.owner.login,
        private: response.data.private,
        defaultBranch: response.data.default_branch
      };

      // Create main.tex with sample LaTeX code
      const sampleLatex = `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{tikz}
\\usepackage{graphicx}

\\title{Welcome to P2P Editor}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}

Welcome to the P2P collaborative LaTeX editor! This is a sample document to get you started.

\\subsection{Mathematics}

Here's Einstein's famous equation:
\\begin{equation}
    E = mc^2
\\end{equation}

And a more complex example:
\\begin{align}
    \\nabla \\times \\vec{\\mathbf{B}} - \\frac{1}{c}\\frac{\\partial\\vec{\\mathbf{E}}}{\\partial t} &= \\frac{4\\pi}{c}\\vec{\\mathbf{j}} \\\\
    \\nabla \\cdot \\vec{\\mathbf{E}} &= 4 \\pi \\rho
\\end{align}

\\subsection{TikZ Graphics}

You can create beautiful diagrams with TikZ:

\\begin{center}
\\begin{tikzpicture}
    \\draw[->] (0,0) -- (4,0) node[right] {$x$};
    \\draw[->] (0,0) -- (0,3) node[above] {$y$};
    \\draw[domain=0:3.5, smooth, variable=\\x, blue, thick] 
        plot ({\\x}, {\\x*\\x/4});
    \\node at (2,2.5) {$y = \\frac{x^2}{4}$};
\\end{tikzpicture}
\\end{center}

\\section{Collaboration}

This editor supports real-time collaboration:
\\begin{itemize}
    \\item Share the same file with colleagues
    \\item See changes in real-time
    \\item Work offline with local persistence
    \\item Push changes to GitHub when ready
\\end{itemize}

\\section{Next Steps}

Edit this document or create new files to start your project. Happy collaborating!

\\end{document}
`;

      // Create the main.tex file
      try {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: repoData.owner,
          repo: repoData.name,
          path: 'main.tex',
          message: 'Initialize with sample LaTeX document',
          content: btoa(unescape(encodeURIComponent(sampleLatex)))
        });
      } catch (err) {
        console.error('Failed to create main.tex:', err);
      }

      return repoData;
    } catch (err) {
      setError(err.message);
      console.error('Error creating repo:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [octokit]);

  /**
   * Create a new file in repository
   */
  const createFile = useCallback(async (owner, repo, path, content, message) => {
    setLoading(true);
    setError(null);
    try {
      const encodedContent = btoa(unescape(encodeURIComponent(content || '')));

      const response = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: message || `Create ${path}`,
        content: encodedContent
      });

      return {
        commit: response.data.commit,
        content: response.data.content
      };
    } catch (err) {
      setError(err.message);
      console.error('Error creating file:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [octokit]);

  return {
    getFileContent,
    updateFileContent,
    getRepoTree,
    getRepoInfo,
    listRepos,
    createRepo,
    createFile,
    loading,
    error
  };
}
