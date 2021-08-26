package com.sap.iot.edgeservices.edgeml.util;

import static java.nio.file.StandardWatchEventKinds.ENTRY_CREATE;
import static java.nio.file.StandardWatchEventKinds.ENTRY_DELETE;
import static java.nio.file.StandardWatchEventKinds.ENTRY_MODIFY;
import static java.nio.file.StandardWatchEventKinds.OVERFLOW;

import java.io.Closeable;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.ClosedWatchServiceException;
import java.nio.file.FileSystems;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.WatchEvent;
import java.nio.file.WatchEvent.Kind;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Watches a directory for changes and notifies of those changes.
 */
public class DirectoryWatcher implements Closeable {
    public interface DirectoryListener {
        default void fileCreated(Path path) {
        };

        default void fileUpdated(Path path) {
        };

        default void fileDeleted(Path path) {
        };

        default void directoryCreated(Path path) {
        };

        default void directoryDeleted(Path path) {
        };
    }

    private final WatchService watcher;
    private final Map<WatchKey, Path> watchKeys;
    private final Path directory;
    private final boolean recursive;
    private final Kind<?>[] watchEventKinds;
    private final DirectoryListener listener;
    private Thread thread;

    // Need to track which paths are directories so that when ENTRY_DELETE event comes we can tell if it's a directory
    // or file. Calling Files.isDirectory() won't work because the file is already deleted.
    private final Set<Path> directories;

    public DirectoryWatcher(Path directory, boolean recursive, DirectoryListener listener, Kind<?>... events)
        throws IOException {

        if (!Files.isDirectory(directory, LinkOption.NOFOLLOW_LINKS)) {
            throw new FileNotFoundException("Directory " + directory + " not found");
        }

        watcher = FileSystems.getDefault().newWatchService();
        watchKeys = new HashMap<WatchKey, Path>();
        directories = new HashSet<>();

        this.directory = directory;
        this.recursive = recursive;
        this.listener = listener;
        this.watchEventKinds = events;

        if (recursive) {
            walkTree(directory, true);
        } else {
            walkTree(directory, false);
            register(directory);
        }

        thread = new Thread(this::processEvents);
        thread.setDaemon(true);
        thread.setName(DirectoryWatcher.class.getSimpleName() + "(" + directory + ")");
        thread.start();
    }

    public Path getDirectory() {
        return directory;
    }

    @Override
    public void close() throws IOException {
        // Closing the watcher triggers the thread to exit
        watcher.close();

        // Wait for the thread to exit
        try {
            thread.join();
        } catch (InterruptedException e) {
        }

        directories.clear();
    }

    private void register(Path path) throws IOException {
        WatchKey key = path.register(watcher, watchEventKinds);
        watchKeys.put(key, path);
    }

    private void walkTree(Path path, boolean register) throws IOException {
        Files.walkFileTree(path, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
                if (register) {
                    register(dir);
                }

                directories.add(dir);

                return FileVisitResult.CONTINUE;
            }
        });
    }

    private void processEvents() {
        while (true) {
            // Wait for WatchKey to be signaled
            WatchKey watchKey;
            try {
                watchKey = watcher.take();
            } catch (InterruptedException | ClosedWatchServiceException e) {
                break;
            }

            // Prevent duplicate file ENTRY_MODIFY events (the contents is modified then the timestamp)
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
            }

            // Gets the Path for the WatchKey
            Path parentPath = watchKeys.get(watchKey);
            if (parentPath == null) {
                continue;
            }

            // Iterate over all WatchEvents on the WatchKey
            for (WatchEvent<?> event : watchKey.pollEvents()) {
                // An overflow event indicating events were lost
                Kind<?> kind = event.kind();
                if (event.kind() == OVERFLOW) {
                    continue;
                }

                // Context for event is the relative path to the file. Combine with parent path to get full path to
                // file.
                @SuppressWarnings("unchecked")
                Path childPath = parentPath.resolve(((WatchEvent<Path>) event).context());

                boolean isDirectory;
                if (kind == ENTRY_CREATE) {
                    isDirectory = Files.isDirectory(childPath, LinkOption.NOFOLLOW_LINKS);
                } else {
                    isDirectory = directories.contains(childPath);
                }

                if (isDirectory) {
                    if (kind == ENTRY_CREATE) {
                        directories.add(childPath);

                        // If a directory was created and recursive flag set then also register the directory
                        if (recursive) {
                            try {
                                walkTree(childPath, true);
                            } catch (IOException e) {
                                // TODO: Handle this
                            }
                        }

                        listener.directoryCreated(childPath);
                    } else if (kind == ENTRY_MODIFY) {
                        // Ignore directory modify events which are fired when files or directories within it change
                    } else if (kind == ENTRY_DELETE) {
                        directories.remove(childPath);

                        listener.directoryDeleted(childPath);
                    }
                } else {
                    if (kind == ENTRY_CREATE) {
                        listener.fileCreated(childPath);
                    } else if (kind == ENTRY_MODIFY) {
                        listener.fileUpdated(childPath);
                    } else if (kind == ENTRY_DELETE) {
                        listener.fileDeleted(childPath);
                    }
                }
            }

            // Reset the WatchKey and remove from set if directory no longer accessible
            boolean valid = watchKey.reset();
            if (!valid) {
                watchKeys.remove(watchKey);

                // If all directories are inaccessible then exit
                if (watchKeys.isEmpty()) {
                    break;
                }
            }
        }
    }

    public static void main(String args[]) {
        try {
            Path directory = Paths.get("C:\\Temp");

            DirectoryListener listener = new DirectoryListener() {
                public void fileCreated(Path path) {
                    System.out.println("File created: " + path);
                }

                public void fileUpdated(Path path) {
                    System.out.println("File updated: " + path);
                }

                public void fileDeleted(Path path) {
                    System.out.println("File deleted: " + path);
                }

                public void directoryCreated(Path path) {
                    System.out.println("Directory created: " + path);
                }

                public void directoryDeleted(Path path) {
                    System.out.println("Directory deleted: " + path);
                }
            };

            DirectoryWatcher watcher = new DirectoryWatcher(directory, true, listener, ENTRY_CREATE, ENTRY_MODIFY,
                ENTRY_DELETE);

            System.out.println("Watching directory " + directory + " ...");
            Thread.sleep(60000);

            watcher.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}