package com.jbes.lifestealspawn.util;

import org.bukkit.Location;
import org.bukkit.configuration.file.FileConfiguration;

public final class RegionUtils {
    private RegionUtils() {
    }

    public static int centerX(FileConfiguration config) {
        return config.getInt("center-x", 0);
    }

    public static int centerZ(FileConfiguration config) {
        return config.getInt("center-z", 0);
    }

    public static int spawnRadius(FileConfiguration config) {
        return Math.max(1, config.getInt("spawn-size", 250) / 2);
    }

    public static int preparedRadius(FileConfiguration config) {
        return spawnRadius(config) + Math.max(0, config.getInt("buffer-size", 200));
    }

    public static boolean isInsideSpawn(Location location, FileConfiguration config) {
        return isInsideSquare(location, config, spawnRadius(config));
    }

    public static boolean isInsidePreparedArea(Location location, FileConfiguration config) {
        return isInsideSquare(location, config, preparedRadius(config));
    }

    public static boolean isInsideBuffer(Location location, FileConfiguration config) {
        return isInsidePreparedArea(location, config) && !isInsideSpawn(location, config);
    }

    public static boolean isInsideSquare(Location location, FileConfiguration config, int radius) {
        if (location == null) {
            return false;
        }
        int dx = Math.abs(location.getBlockX() - centerX(config));
        int dz = Math.abs(location.getBlockZ() - centerZ(config));
        return dx <= radius && dz <= radius;
    }
}
