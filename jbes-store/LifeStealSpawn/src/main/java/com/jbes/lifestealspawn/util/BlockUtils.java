package com.jbes.lifestealspawn.util;

import java.util.Locale;
import java.util.Random;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.block.Sign;
import org.bukkit.block.sign.Side;
import org.bukkit.block.sign.SignSide;

public final class BlockUtils {
    private BlockUtils() {
    }

    public static Material material(String name, Material fallback) {
        if (name == null || name.isBlank()) {
            return fallback;
        }
        Material material = Material.matchMaterial(name.toUpperCase(Locale.ROOT));
        return material == null || !material.isBlock() ? fallback : material;
    }

    public static void setBlock(World world, int x, int y, int z, Material material) {
        world.getBlockAt(x, y, z).setType(material, false);
    }

    public static void fill(World world, int minX, int minY, int minZ, int maxX, int maxY, int maxZ, Material material) {
        for (int x = Math.min(minX, maxX); x <= Math.max(minX, maxX); x++) {
            for (int y = Math.min(minY, maxY); y <= Math.max(minY, maxY); y++) {
                for (int z = Math.min(minZ, maxZ); z <= Math.max(minZ, maxZ); z++) {
                    setBlock(world, x, y, z, material);
                }
            }
        }
    }

    public static void disk(World world, int centerX, int y, int centerZ, int radius, Material edge, Material inner) {
        int radiusSquared = radius * radius;
        int innerSquared = Math.max(0, radius - 2) * Math.max(0, radius - 2);
        for (int x = centerX - radius; x <= centerX + radius; x++) {
            for (int z = centerZ - radius; z <= centerZ + radius; z++) {
                int distanceSquared = square(x - centerX) + square(z - centerZ);
                if (distanceSquared <= radiusSquared) {
                    setBlock(world, x, y, z, distanceSquared >= innerSquared ? edge : inner);
                }
            }
        }
    }

    public static void path(World world, int fromX, int fromZ, int toX, int toZ, int y, Random random) {
        int minX = Math.min(fromX, toX);
        int maxX = Math.max(fromX, toX);
        int minZ = Math.min(fromZ, toZ);
        int maxZ = Math.max(fromZ, toZ);
        for (int x = minX - 3; x <= maxX + 3; x++) {
            for (int z = minZ - 3; z <= maxZ + 3; z++) {
                boolean onLine = fromX == toX ? Math.abs(x - fromX) <= 3 && z >= minZ && z <= maxZ : Math.abs(z - fromZ) <= 3 && x >= minX && x <= maxX;
                if (onLine) {
                    Material material = switch (random.nextInt(5)) {
                        case 0 -> Material.CRACKED_STONE_BRICKS;
                        case 1 -> Material.POLISHED_DEEPSLATE;
                        case 2 -> Material.GRAVEL;
                        case 3 -> Material.COARSE_DIRT;
                        default -> Material.STONE_BRICKS;
                    };
                    setBlock(world, x, y, z, material);
                }
            }
        }
    }

    public static void sign(World world, int x, int y, int z, Material type, String... lines) {
        setBlock(world, x, y, z, type);
        Block block = world.getBlockAt(x, y, z);
        if (block.getState() instanceof Sign sign) {
            SignSide side = sign.getSide(Side.FRONT);
            for (int i = 0; i < Math.min(4, lines.length); i++) {
                side.setLine(i, lines[i]);
            }
            sign.update(true, false);
        }
    }

    private static int square(int value) {
        return value * value;
    }
}
