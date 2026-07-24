package com.jbes.lifestealspawn.generation;

import com.jbes.lifestealspawn.util.BlockUtils;
import com.jbes.lifestealspawn.util.RegionUtils;
import com.jbes.lifestealspawn.util.TextUtils;
import java.util.ArrayDeque;
import java.util.Queue;
import java.util.Random;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.data.type.Lantern;
import org.bukkit.command.CommandSender;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.entity.ArmorStand;
import org.bukkit.entity.Entity;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitRunnable;

public final class SpawnGenerator {
    private static final int TERRAIN_BATCH = 180;
    private static final int DECOR_BATCH = 2_500;

    private final Plugin plugin;
    private BukkitRunnable activeTask;

    public SpawnGenerator(Plugin plugin) {
        this.plugin = plugin;
    }

    public boolean isRunning() {
        return activeTask != null;
    }

    public void cancel() {
        if (activeTask != null) {
            activeTask.cancel();
            activeTask = null;
        }
    }

    public void generate(World world, CommandSender sender, boolean confirmedClear) {
        FileConfiguration config = plugin.getConfig();
        int centerX = RegionUtils.centerX(config);
        int centerZ = RegionUtils.centerZ(config);
        int spawnRadius = RegionUtils.spawnRadius(config);
        int preparedRadius = RegionUtils.preparedRadius(config);
        int y = resolveSpawnY(world, centerX, centerZ, config);
        Material ground = BlockUtils.material(config.getString("ground-block"), Material.GRASS_BLOCK);
        Material border = BlockUtils.material(config.getString("border-block"), Material.RED_CONCRETE);

        TextUtils.send(sender, "&7Preparing clutchsmp spawn at &f" + centerX + ", " + y + ", " + centerZ + "&7.");
        TextUtils.send(sender, "&7Spawn area: &f" + config.getInt("spawn-size", 250) + "x" + config.getInt("spawn-size", 250) + "&7. Protected flat buffer: &f" + config.getInt("buffer-size", 200) + " blocks each side&7.");

        Queue<Runnable> jobs = new ArrayDeque<>();
        enqueueTerrain(world, jobs, centerX, centerZ, y, preparedRadius, spawnRadius, ground, confirmedClear || config.getBoolean("clear-area-before-generation", false), config.getBoolean("plains-style-terrain", true));
        enqueueBuild(world, jobs, centerX, centerZ, y, spawnRadius, preparedRadius, border);

        int total = jobs.size();
        activeTask = new BukkitRunnable() {
            private int tick;

            @Override
            public void run() {
                int work = jobs.size() > 20_000 ? TERRAIN_BATCH : DECOR_BATCH;
                for (int i = 0; i < work && !jobs.isEmpty(); i++) {
                    jobs.poll().run();
                }
                tick++;
                if (tick % 20 == 0 || jobs.isEmpty()) {
                    int done = total - jobs.size();
                    int percent = (int) Math.round((done * 100.0) / Math.max(1, total));
                    TextUtils.send(sender, "&7Generation progress: &f" + percent + "% &8(" + done + "/" + total + " jobs)");
                }
                if (jobs.isEmpty()) {
                    world.setSpawnLocation(new Location(world, centerX + 0.5, y + 4, centerZ + 0.5));
                    TextUtils.send(sender, "&aclutchsmp spawn generation finished.");
                    activeTask = null;
                    cancel();
                }
            }
        };
        activeTask.runTaskTimer(plugin, 1L, 1L);
    }

    private int resolveSpawnY(World world, int centerX, int centerZ, FileConfiguration config) {
        String configured = config.getString("spawn-y", "auto");
        if (configured != null && !configured.equalsIgnoreCase("auto")) {
            try {
                return Integer.parseInt(configured);
            } catch (NumberFormatException ignored) {
                plugin.getLogger().warning("Invalid spawn-y value, falling back to auto.");
            }
        }
        return Math.max(64, world.getHighestBlockYAt(centerX, centerZ));
    }

    private void enqueueTerrain(World world, Queue<Runnable> jobs, int centerX, int centerZ, int y, int preparedRadius, int spawnRadius, Material ground, boolean clear, boolean plainsStyle) {
        Random random = new Random(7122026L);
        for (int x = centerX - preparedRadius; x <= centerX + preparedRadius; x++) {
            for (int z = centerZ - preparedRadius; z <= centerZ + preparedRadius; z++) {
                int fx = x;
                int fz = z;
                jobs.add(() -> {
                    world.getChunkAt(fx >> 4, fz >> 4).load(true);
                    for (int yy = y - 4; yy < y; yy++) {
                        BlockUtils.setBlock(world, fx, yy, fz, Material.DIRT);
                    }
                    BlockUtils.setBlock(world, fx, y, fz, ground);
                    int clearTop = clear ? world.getMaxHeight() - 1 : y + 8;
                    for (int yy = y + 1; yy <= clearTop; yy++) {
                        BlockUtils.setBlock(world, fx, yy, fz, Material.AIR);
                    }

                    int edgeDistance = preparedRadius - Math.max(Math.abs(fx - centerX), Math.abs(fz - centerZ));
                    if (plainsStyle && edgeDistance <= 42 && randomValue(fx, fz, 17) < 10) {
                        decorateNaturalBuffer(world, fx, y, fz, randomValue(fx, fz, 91));
                    } else if (plainsStyle && Math.max(Math.abs(fx - centerX), Math.abs(fz - centerZ)) > spawnRadius + 25 && randomValue(fx, fz, 31) < 4) {
                        decorateNaturalBuffer(world, fx, y, fz, randomValue(fx, fz, 67));
                    }
                });
            }
        }
    }

    private void enqueueBuild(World world, Queue<Runnable> jobs, int cx, int cz, int y, int spawnRadius, int preparedRadius, Material border) {
        jobs.add(() -> removeGeneratedArmorStands(world, cx, cz, preparedRadius));
        jobs.add(() -> buildCenter(world, cx, cz, y));
        jobs.add(() -> buildSwordStatues(world, cx, cz, y));
        jobs.add(() -> buildBorder(world, cx, cz, y, spawnRadius, border));
        jobs.add(() -> buildMainPaths(world, cx, cz, y));
        jobs.add(() -> buildLanterns(world, cx, cz, y));
        jobs.add(() -> buildCrates(world, cx, cz, y));
        jobs.add(() -> buildRanks(world, cx, cz, y));
        jobs.add(() -> buildRules(world, cx, cz, y));
        jobs.add(() -> buildPvpExit(world, cx, cz, y, spawnRadius, preparedRadius));
        jobs.add(() -> buildAfkZone(world, cx, cz, y));
        jobs.add(() -> buildInfo(world, cx, cz, y));
        jobs.add(() -> buildPolishDetails(world, cx, cz, y, spawnRadius));
        jobs.add(() -> buildBattleDetails(world, cx, cz, y, spawnRadius));
        jobs.add(() -> buildNaturalTransition(world, cx, cz, y, preparedRadius));
        jobs.add(() -> removeMobs(world, cx, cz, preparedRadius));
    }

    private void removeGeneratedArmorStands(World world, int cx, int cz, int radius) {
        for (Entity entity : world.getNearbyEntities(new Location(world, cx, world.getMinHeight() + 128, cz), radius, 256, radius)) {
            if (entity.getType() == EntityType.ARMOR_STAND) {
                entity.remove();
            }
        }
    }

    private void buildCenter(World world, int cx, int cz, int y) {
        BlockUtils.disk(world, cx, y + 1, cz, 18, Material.BLACKSTONE, Material.POLISHED_DEEPSLATE);
        BlockUtils.disk(world, cx, y + 2, cz, 15, Material.DEEPSLATE_BRICKS, Material.STONE_BRICKS);
        BlockUtils.disk(world, cx, y + 3, cz, 4, Material.REDSTONE_BLOCK, Material.RED_CONCRETE);
        BlockUtils.disk(world, cx, y + 3, cz, 2, Material.RED_STAINED_GLASS, Material.REDSTONE_BLOCK);
        for (int[] offset : new int[][]{{14, 14}, {14, -14}, {-14, 14}, {-14, -14}}) {
            pillar(world, cx + offset[0], y + 3, cz + offset[1], 6);
        }
        for (int[] offset : new int[][]{{0, 20}, {0, -20}, {20, 0}, {-20, 0}}) {
            arch(world, cx + offset[0], y + 2, cz + offset[1], offset[0] == 0);
        }
        BlockUtils.setBlock(world, cx, y + 4, cz, Material.RED_STAINED_GLASS);
        buildGroundTitle(world, cx, cz - 32, y + 1);
        BlockUtils.sign(world, cx - 2, y + 4, cz - 7, Material.OAK_SIGN, "clutchsmp", "spawn", "no pvp", "inside border");
    }

    private void buildBorder(World world, int cx, int cz, int y, int radius, Material border) {
        for (int x = cx - radius; x <= cx + radius; x++) {
            for (int dz : new int[]{-radius, radius}) {
                BlockUtils.setBlock(world, x, y + 1, cz + dz, border);
                if (x % 5 == 0) {
                    BlockUtils.setBlock(world, x, y, cz + dz, Material.BLACKSTONE);
                }
                if (x % 8 == 0) {
                    BlockUtils.setBlock(world, x, y + 2, cz + dz, Material.RED_STAINED_GLASS);
                }
            }
        }
        for (int z = cz - radius; z <= cz + radius; z++) {
            for (int dx : new int[]{-radius, radius}) {
                BlockUtils.setBlock(world, cx + dx, y + 1, z, border);
                if (z % 5 == 0) {
                    BlockUtils.setBlock(world, cx + dx, y, z, Material.BLACKSTONE);
                }
                if (z % 8 == 0) {
                    BlockUtils.setBlock(world, cx + dx, y + 2, z, Material.RED_STAINED_GLASS);
                }
            }
        }
        for (int[] corner : new int[][]{{radius, radius}, {radius, -radius}, {-radius, radius}, {-radius, -radius}}) {
            redTower(world, cx + corner[0], y + 1, cz + corner[1]);
        }
    }

    private void buildMainPaths(World world, int cx, int cz, int y) {
        Random random = new Random(21L);
        BlockUtils.path(world, cx, cz - 18, cx, cz - 108, y + 1, random);
        BlockUtils.path(world, cx, cz + 18, cx, cz + 108, y + 1, random);
        BlockUtils.path(world, cx + 18, cz, cx + 108, cz, y + 1, random);
        BlockUtils.path(world, cx - 18, cz, cx - 108, cz, y + 1, random);
        BlockUtils.path(world, cx - 45, cz - 45, cx + 45, cz + 45, y + 1, random);
        BlockUtils.path(world, cx - 45, cz + 45, cx + 45, cz - 45, y + 1, random);
    }

    private void buildLanterns(World world, int cx, int cz, int y) {
        for (int i = 24; i <= 108; i += 12) {
            lamp(world, cx - 5, y + 2, cz - i);
            lamp(world, cx + 5, y + 2, cz - i);
            lamp(world, cx - 5, y + 2, cz + i);
            lamp(world, cx + 5, y + 2, cz + i);
            lamp(world, cx - i, y + 2, cz - 5);
            lamp(world, cx - i, y + 2, cz + 5);
            lamp(world, cx + i, y + 2, cz - 5);
            lamp(world, cx + i, y + 2, cz + 5);
        }
    }

    private void buildCrates(World world, int cx, int cz, int y) {
        int baseZ = cz - 86;
        BlockUtils.fill(world, cx - 32, y + 1, baseZ - 16, cx + 32, y + 1, baseZ + 16, Material.POLISHED_DEEPSLATE);
        lowWall(world, cx - 34, y + 2, baseZ - 18, cx + 34, baseZ + 18);
        crate(world, cx - 20, y + 2, baseZ, Material.OAK_PLANKS, Material.IRON_BLOCK);
        crate(world, cx, y + 2, baseZ, Material.PURPUR_BLOCK, Material.GOLD_BLOCK);
        crate(world, cx + 20, y + 2, baseZ, Material.CRIMSON_PLANKS, Material.REDSTONE_BLOCK);
        BlockUtils.sign(world, cx - 22, y + 3, baseZ + 8, Material.OAK_SIGN, "Common", "Crate", "placeholder");
        BlockUtils.sign(world, cx - 2, y + 3, baseZ + 9, Material.OAK_SIGN, "Epic", "Crate", "placeholder");
        BlockUtils.sign(world, cx + 18, y + 3, baseZ + 8, Material.OAK_SIGN, "Legendary", "Crate", "placeholder");
        for (int x = cx - 28; x <= cx + 28; x += 14) {
            spike(world, x, y + 2, baseZ - 15, 4);
            spike(world, x, y + 2, baseZ + 15, 4);
        }
    }

    private void buildRanks(World world, int cx, int cz, int y) {
        String[] names = {"VIP", "SVIP", "SPONSOR", "ELITE", "SWAGGER"};
        Material[] colors = {Material.LIME_CONCRETE, Material.CYAN_CONCRETE, Material.YELLOW_CONCRETE, Material.PURPLE_CONCRETE, Material.RED_CONCRETE};
        for (int i = 0; i < names.length; i++) {
            int z = cz - 40 + i * 20;
            int x = cx - 88;
            BlockUtils.fill(world, x - 7, y + 1, z - 6, x + 7, y + 1, z + 6, Material.SPRUCE_PLANKS);
            BlockUtils.fill(world, x - 8, y + 5, z - 7, x + 8, y + 5, z + 7, Material.DARK_OAK_SLAB);
            BlockUtils.fill(world, x - 7, y + 4, z - 6, x + 7, y + 4, z - 6, colors[i]);
            BlockUtils.setBlock(world, x, y + 2, z, colors[i]);
            BlockUtils.setBlock(world, x, y + 3, z, Material.CHEST);
            BlockUtils.sign(world, x - 2, y + 2, z + 5, Material.OAK_SIGN, names[i], "rank", "display");
            bannerPole(world, x + 8, y + 2, z, colors[i]);
        }
    }

    private void buildRules(World world, int cx, int cz, int y) {
        int x = cx + 88;
        BlockUtils.fill(world, x, y + 2, cz - 22, x, y + 9, cz + 22, Material.DEEPSLATE_BRICKS);
        BlockUtils.fill(world, x - 1, y + 1, cz - 24, x + 1, y + 1, cz + 24, Material.POLISHED_DEEPSLATE);
        BlockUtils.fill(world, x - 1, y + 9, cz - 24, x + 1, y + 9, cz + 24, Material.BLACKSTONE);
        String[] rules = {"No Cheating", "No Bug Abuse", "No Doxing", "Respect Staff", "PvP outside spawn"};
        for (int i = 0; i < rules.length; i++) {
            BlockUtils.sign(world, x - 1, y + 4 + (i % 2) * 2, cz - 14 + i * 7, Material.OAK_WALL_SIGN, rules[i]);
        }
        bench(world, x - 10, y + 2, cz - 14);
        bench(world, x - 10, y + 2, cz + 14);
    }

    private void buildPvpExit(World world, int cx, int cz, int y, int spawnRadius, int preparedRadius) {
        int gateZ = cz + spawnRadius - 7;
        BlockUtils.fill(world, cx - 8, y + 1, gateZ, cx + 8, y + 10, gateZ + 2, Material.NETHER_BRICKS);
        BlockUtils.fill(world, cx - 4, y + 2, gateZ, cx + 4, y + 7, gateZ + 2, Material.AIR);
        BlockUtils.fill(world, cx - 10, y + 1, gateZ - 5, cx + 10, y + 1, gateZ - 5, Material.REDSTONE_BLOCK);
        BlockUtils.fill(world, cx - 12, y + 1, gateZ - 8, cx + 12, y + 1, gateZ - 7, Material.RED_CONCRETE);
        for (int x = cx - 6; x <= cx + 6; x += 4) {
            BlockUtils.setBlock(world, x, y + 9, gateZ + 1, Material.IRON_CHAIN);
            BlockUtils.setBlock(world, x, y + 8, gateZ + 1, Material.REDSTONE_LAMP);
        }
        BlockUtils.sign(world, cx - 2, y + 2, gateZ - 10, Material.OAK_SIGN, "PvP enabled", "after red line", "buffer fight", "allowed");
        for (int z = gateZ + 4; z <= cz + preparedRadius + 40; z++) {
            for (int x = cx - 2; x <= cx + 2; x++) {
                Material material = Math.abs(x - cx) == 2 ? Material.COARSE_DIRT : Material.GRAVEL;
                BlockUtils.setBlock(world, x, y + 1, z, material);
            }
        }
    }

    private void buildAfkZone(World world, int cx, int cz, int y) {
        int x = cx + 58;
        int z = cz - 54;
        BlockUtils.disk(world, x, y + 1, z, 14, Material.SPRUCE_PLANKS, Material.GRASS_BLOCK);
        BlockUtils.disk(world, x, y + 2, z, 6, Material.STONE_BRICKS, Material.WATER);
        flowerRing(world, x, y + 2, z, 12);
        BlockUtils.setBlock(world, x, y + 3, z, Material.STONE_BRICK_WALL);
        BlockUtils.setBlock(world, x, y + 4, z, Material.WATER);
        bench(world, x - 12, y + 2, z);
        bench(world, x + 12, y + 2, z);
        BlockUtils.sign(world, x - 2, y + 3, z + 9, Material.OAK_SIGN, "AFK", "Zone", "clutchsmp");
    }

    private void buildInfo(World world, int cx, int cz, int y) {
        int x = cx + 45;
        int z = cz + 48;
        marketBuilding(world, x, y + 1, z);
        BlockUtils.sign(world, x - 1, y + 5, z + 5, Material.OAK_WALL_SIGN, "clutchsmp", "info");
        String[] commands = {"/discord", "/shop", "/vote", "/rules", "/spawn"};
        for (int i = 0; i < commands.length; i++) {
            BlockUtils.sign(world, x - 5 + (i % 3) * 5, y + 3 + (i / 3), z + 5, Material.OAK_WALL_SIGN, commands[i]);
        }
    }

    private void buildPolishDetails(World world, int cx, int cz, int y, int spawnRadius) {
        for (int offset = -96; offset <= 96; offset += 24) {
            hedgePlanter(world, cx + offset, y + 1, cz - 112, true);
            hedgePlanter(world, cx + offset, y + 1, cz + 112, true);
            hedgePlanter(world, cx - 112, y + 1, cz + offset, false);
            hedgePlanter(world, cx + 112, y + 1, cz + offset, false);
        }
        for (int offset = -72; offset <= 72; offset += 36) {
            smallTree(world, cx + offset, y + 1, cz - 96);
            smallTree(world, cx + offset, y + 1, cz + 96);
            smallTree(world, cx - 96, y + 1, cz + offset);
            smallTree(world, cx + 96, y + 1, cz + offset);
        }
        gardenStrip(world, cx - 74, y + 1, cz - 28, cx - 46, cz - 20);
        gardenStrip(world, cx + 46, y + 1, cz + 20, cx + 74, cz + 28);
        gardenStrip(world, cx - 28, y + 1, cz + 46, cx - 20, cz + 74);
        gardenStrip(world, cx + 20, y + 1, cz - 74, cx + 28, cz - 46);
        for (int x = cx - 96; x <= cx + 96; x += 12) {
            BlockUtils.setBlock(world, x, y + 1, cz - spawnRadius + 8, Material.RED_CARPET);
            BlockUtils.setBlock(world, x, y + 1, cz + spawnRadius - 8, Material.RED_CARPET);
        }
        for (int z = cz - 96; z <= cz + 96; z += 12) {
            BlockUtils.setBlock(world, cx - spawnRadius + 8, y + 1, z, Material.RED_CARPET);
            BlockUtils.setBlock(world, cx + spawnRadius - 8, y + 1, z, Material.RED_CARPET);
        }
    }

    private void buildNaturalTransition(World world, int cx, int cz, int y, int preparedRadius) {
        Random random = new Random(2602L);
        for (int i = 0; i < 240; i++) {
            int side = random.nextInt(4);
            int x = cx + random.nextInt(preparedRadius * 2 + 1) - preparedRadius;
            int z = cz + random.nextInt(preparedRadius * 2 + 1) - preparedRadius;
            if (side == 0) z = cz - preparedRadius + random.nextInt(35);
            if (side == 1) z = cz + preparedRadius - random.nextInt(35);
            if (side == 2) x = cx - preparedRadius + random.nextInt(35);
            if (side == 3) x = cx + preparedRadius - random.nextInt(35);
            Material material = random.nextBoolean() ? Material.TALL_GRASS : Material.POPPY;
            BlockUtils.setBlock(world, x, y + 1, z, material);
        }
        for (int i = 0; i < 26; i++) {
            int x = cx + random.nextInt(preparedRadius * 2 + 1) - preparedRadius;
            int z = cz + random.nextInt(preparedRadius * 2 + 1) - preparedRadius;
            if (Math.max(Math.abs(x - cx), Math.abs(z - cz)) > preparedRadius - 45) {
                BlockUtils.fill(world, x - 1, y + 1, z - 1, x + 1, y + 1, z + 1, Material.MOSSY_COBBLESTONE);
            }
        }
    }

    private static void decorateNaturalBuffer(World world, int x, int y, int z, int value) {
        if (value < 20) {
            BlockUtils.setBlock(world, x, y + 1, z, Material.SHORT_GRASS);
        } else if (value < 27) {
            BlockUtils.setBlock(world, x, y + 1, z, Material.POPPY);
        } else if (value < 33) {
            BlockUtils.setBlock(world, x, y + 1, z, Material.DANDELION);
        } else if (value < 36) {
            BlockUtils.setBlock(world, x, y, z, Material.COARSE_DIRT);
        }
    }

    private void pillar(World world, int x, int y, int z, int height) {
        for (int i = 0; i < height; i++) {
            BlockUtils.setBlock(world, x, y + i, z, i % 2 == 0 ? Material.POLISHED_DEEPSLATE : Material.BLACKSTONE);
        }
        BlockUtils.setBlock(world, x, y + height, z, Material.LANTERN);
    }

    private void redTower(World world, int x, int y, int z) {
        BlockUtils.fill(world, x - 1, y, z - 1, x + 1, y + 5, z + 1, Material.BLACKSTONE);
        BlockUtils.setBlock(world, x, y + 6, z, Material.REDSTONE_BLOCK);
        BlockUtils.setBlock(world, x, y + 7, z, Material.RED_STAINED_GLASS);
    }

    private void lamp(World world, int x, int y, int z) {
        BlockUtils.setBlock(world, x, y, z, Material.SPRUCE_FENCE);
        BlockUtils.setBlock(world, x, y + 1, z, Material.SPRUCE_FENCE);
        BlockUtils.setBlock(world, x, y + 2, z, Material.LANTERN);
        if (world.getBlockAt(x, y + 2, z).getBlockData() instanceof Lantern lantern) {
            lantern.setHanging(false);
            world.getBlockAt(x, y + 2, z).setBlockData(lantern, false);
        }
    }

    private void crate(World world, int x, int y, int z, Material floor, Material accent) {
        BlockUtils.fill(world, x - 5, y - 1, z - 5, x + 5, y - 1, z + 5, floor);
        BlockUtils.fill(world, x - 3, y, z - 3, x + 3, y, z + 3, Material.BLACKSTONE);
        BlockUtils.fill(world, x - 2, y + 1, z - 2, x + 2, y + 1, z + 2, accent);
        BlockUtils.fill(world, x - 3, y + 1, z - 3, x + 3, y + 1, z - 3, Material.IRON_BARS);
        BlockUtils.setBlock(world, x, y + 2, z, Material.BARREL);
    }

    private void buildSwordStatues(World world, int cx, int cz, int y) {
        sword(world, cx - 22, y + 4, cz, true);
        sword(world, cx + 22, y + 4, cz, false);
        BlockUtils.fill(world, cx - 28, y + 1, cz - 3, cx + 28, y + 1, cz + 3, Material.CRACKED_STONE_BRICKS);
        BlockUtils.fill(world, cx - 3, y + 1, cz - 28, cx + 3, y + 1, cz + 28, Material.CRACKED_STONE_BRICKS);
    }

    private void sword(World world, int x, int y, int z, boolean positiveSlope) {
        for (int i = 0; i < 18; i++) {
            int dx = positiveSlope ? i : -i;
            BlockUtils.setBlock(world, x + dx, y + i, z, Material.IRON_BLOCK);
            BlockUtils.setBlock(world, x + dx, y + i, z + 1, Material.LIGHT_GRAY_CONCRETE);
        }
        for (int i = -3; i <= 3; i++) {
            BlockUtils.setBlock(world, x + (positiveSlope ? 5 : -5), y + 5, z + i, Material.REDSTONE_BLOCK);
        }
        BlockUtils.setBlock(world, x + (positiveSlope ? 18 : -18), y + 18, z, Material.RED_STAINED_GLASS);
    }

    private void buildGroundTitle(World world, int startX, int startZ, int y) {
        String[] rows = {
                "### #   #  # ### ### # # ### # # ###",
                "#   #   #  #  #  #   # # #   ##  #  ",
                "#   #   #  #  #  #   ### ##  # # ###",
                "#   #   #  #  #  #   # # #   # #   #",
                "### ### ####  #  ### # # ### # # ###"
        };
        int width = rows[0].length();
        int originX = startX - width / 2;
        for (int row = 0; row < rows.length; row++) {
            for (int col = 0; col < rows[row].length(); col++) {
                char c = rows[row].charAt(col);
                if (c == '#') {
                    BlockUtils.setBlock(world, originX + col, y, startZ + row, Material.RED_CONCRETE);
                } else if (c == ' ') {
                    BlockUtils.setBlock(world, originX + col, y, startZ + row, Material.BLACKSTONE);
                }
            }
        }
    }

    private void bench(World world, int x, int y, int z) {
        BlockUtils.fill(world, x - 2, y, z, x + 2, y, z, Material.SPRUCE_STAIRS);
        BlockUtils.setBlock(world, x - 3, y, z, Material.SPRUCE_FENCE);
        BlockUtils.setBlock(world, x + 3, y, z, Material.SPRUCE_FENCE);
    }

    private void arch(World world, int x, int y, int z, boolean eastWest) {
        for (int i = -3; i <= 3; i++) {
            int ax = eastWest ? x + i : x;
            int az = eastWest ? z : z + i;
            BlockUtils.setBlock(world, ax, y + 5, az, Material.POLISHED_DEEPSLATE);
        }
        for (int side : new int[]{-3, 3}) {
            int ax = eastWest ? x + side : x;
            int az = eastWest ? z : z + side;
            BlockUtils.fill(world, ax, y, az, ax, y + 5, az, Material.DEEPSLATE_BRICK_WALL);
            BlockUtils.setBlock(world, ax, y + 6, az, Material.RED_STAINED_GLASS);
        }
    }

    private void lowWall(World world, int minX, int y, int minZ, int maxX, int maxZ) {
        for (int x = minX; x <= maxX; x++) {
            BlockUtils.setBlock(world, x, y, minZ, Material.POLISHED_BLACKSTONE_BRICK_WALL);
            BlockUtils.setBlock(world, x, y, maxZ, Material.POLISHED_BLACKSTONE_BRICK_WALL);
        }
        for (int z = minZ; z <= maxZ; z++) {
            BlockUtils.setBlock(world, minX, y, z, Material.POLISHED_BLACKSTONE_BRICK_WALL);
            BlockUtils.setBlock(world, maxX, y, z, Material.POLISHED_BLACKSTONE_BRICK_WALL);
        }
    }

    private void buildBattleDetails(World world, int cx, int cz, int y, int spawnRadius) {
        for (int[] pos : new int[][]{{-70, -70}, {-35, -82}, {42, -75}, {80, -35}, {75, 42}, {35, 78}, {-42, 74}, {-82, 35}, {-74, -22}, {68, 12}}) {
            ruinedWall(world, cx + pos[0], y + 1, cz + pos[1]);
        }
        for (int[] pos : new int[][]{{-58, 48}, {-48, 58}, {58, -48}, {48, -58}, {-92, 0}, {92, 0}, {0, -92}, {0, 92}}) {
            spikeCluster(world, cx + pos[0], y + 1, cz + pos[1]);
        }
        for (int[] pos : new int[][]{{-32, -32}, {32, 32}, {-32, 32}, {32, -32}, {-105, -105}, {105, -105}, {-105, 105}, {105, 105}}) {
            bannerPole(world, cx + pos[0], y + 2, cz + pos[1], Material.RED_CONCRETE);
        }
        for (int[] pos : new int[][]{{-24, 24}, {24, -24}, {-62, 0}, {62, 0}, {0, -62}, {0, 62}}) {
            statue(world, cx + pos[0], y + 2, cz + pos[1]);
        }
        for (int[] pos : new int[][]{{-52, -52}, {52, 52}, {-52, 52}, {52, -52}}) {
            camp(world, cx + pos[0], y + 1, cz + pos[1]);
        }
        for (int i = -96; i <= 96; i += 24) {
            chainPost(world, cx + i, y + 2, cz - 118);
            chainPost(world, cx + i, y + 2, cz + 118);
            chainPost(world, cx - 118, y + 2, cz + i);
            chainPost(world, cx + 118, y + 2, cz + i);
        }
    }

    private void ruinedWall(World world, int x, int y, int z) {
        for (int i = -5; i <= 5; i++) {
            int h = 2 + Math.abs(i % 3);
            for (int yy = 0; yy < h; yy++) {
                Material material = yy == h - 1 && i % 2 == 0 ? Material.CRACKED_STONE_BRICKS : Material.DEEPSLATE_BRICKS;
                BlockUtils.setBlock(world, x + i, y + yy, z, material);
            }
        }
        BlockUtils.setBlock(world, x - 6, y, z, Material.MOSSY_COBBLESTONE);
        BlockUtils.setBlock(world, x + 6, y, z, Material.MOSSY_COBBLESTONE);
    }

    private void spikeCluster(World world, int x, int y, int z) {
        spike(world, x, y, z, 5);
        spike(world, x + 2, y, z + 1, 3);
        spike(world, x - 2, y, z - 1, 4);
    }

    private void spike(World world, int x, int y, int z, int height) {
        for (int i = 0; i < height; i++) {
            BlockUtils.setBlock(world, x, y + i, z, i == height - 1 ? Material.POINTED_DRIPSTONE : Material.POLISHED_BLACKSTONE_WALL);
        }
    }

    private void bannerPole(World world, int x, int y, int z, Material accent) {
        BlockUtils.fill(world, x, y, z, x, y + 5, z, Material.DARK_OAK_FENCE);
        BlockUtils.setBlock(world, x, y + 6, z, Material.RED_BANNER);
        BlockUtils.setBlock(world, x, y - 1, z, accent);
    }

    private void statue(World world, int x, int y, int z) {
        BlockUtils.fill(world, x - 1, y - 1, z - 1, x + 1, y - 1, z + 1, Material.POLISHED_BLACKSTONE);
        BlockUtils.setBlock(world, x, y, z, Material.POLISHED_BLACKSTONE_BRICKS);
        BlockUtils.setBlock(world, x, y + 1, z, Material.IRON_BLOCK);
        BlockUtils.setBlock(world, x, y + 2, z, Material.CARVED_PUMPKIN);
        BlockUtils.setBlock(world, x - 1, y + 1, z, Material.IRON_BARS);
        BlockUtils.setBlock(world, x + 1, y + 1, z, Material.IRON_BARS);
        BlockUtils.setBlock(world, x, y + 3, z, Material.RED_STAINED_GLASS);
        armorStatue(world, x + 0.5, y + 1, z + 0.5);
    }

    private void armorStatue(World world, double x, double y, double z) {
        ArmorStand stand = (ArmorStand) world.spawnEntity(new Location(world, x, y, z), EntityType.ARMOR_STAND);
        stand.setInvulnerable(true);
        stand.setGravity(false);
        stand.setCustomNameVisible(false);
        stand.getEquipment().setHelmet(new ItemStack(Material.IRON_HELMET));
        stand.getEquipment().setChestplate(new ItemStack(Material.IRON_CHESTPLATE));
        stand.getEquipment().setLeggings(new ItemStack(Material.IRON_LEGGINGS));
        stand.getEquipment().setBoots(new ItemStack(Material.IRON_BOOTS));
        stand.getEquipment().setItemInMainHand(new ItemStack(Material.IRON_SWORD));
    }

    private void camp(World world, int x, int y, int z) {
        BlockUtils.setBlock(world, x, y, z, Material.CAMPFIRE);
        for (int dx = -3; dx <= 3; dx += 3) {
            bench(world, x + dx, y, z);
        }
        BlockUtils.fill(world, x - 4, y - 1, z - 4, x + 4, y - 1, z + 4, Material.COARSE_DIRT);
    }

    private void chainPost(World world, int x, int y, int z) {
        BlockUtils.fill(world, x, y, z, x, y + 3, z, Material.POLISHED_BLACKSTONE_WALL);
        BlockUtils.setBlock(world, x, y + 4, z, Material.IRON_CHAIN);
        BlockUtils.setBlock(world, x, y + 5, z, Material.LANTERN);
    }

    private void marketBuilding(World world, int x, int y, int z) {
        BlockUtils.fill(world, x - 8, y, z - 7, x + 8, y, z + 7, Material.SPRUCE_PLANKS);
        for (int[] corner : new int[][]{{-8, -7}, {-8, 7}, {8, -7}, {8, 7}}) {
            BlockUtils.fill(world, x + corner[0], y + 1, z + corner[1], x + corner[0], y + 5, z + corner[1], Material.DARK_OAK_LOG);
        }
        BlockUtils.fill(world, x - 8, y + 1, z + 7, x + 8, y + 4, z + 7, Material.DARK_OAK_PLANKS);
        BlockUtils.fill(world, x - 8, y + 6, z - 8, x + 8, y + 6, z + 8, Material.DARK_OAK_STAIRS);
        BlockUtils.fill(world, x - 6, y + 7, z - 6, x + 6, y + 7, z + 6, Material.CRIMSON_SLAB);
        BlockUtils.fill(world, x - 5, y + 1, z - 5, x - 1, y + 1, z - 1, Material.BARREL);
        BlockUtils.fill(world, x + 1, y + 1, z - 5, x + 5, y + 1, z - 1, Material.CHEST);
    }

    private void removeMobs(World world, int cx, int cz, int radius) {
        for (Entity entity : world.getNearbyEntities(new Location(world, cx, world.getMinHeight() + 128, cz), radius, 256, radius)) {
            if (entity instanceof LivingEntity && !(entity instanceof Player) && !(entity instanceof ArmorStand)) {
                entity.remove();
            }
        }
    }

    private void flowerRing(World world, int cx, int y, int cz, int radius) {
        for (int x = cx - radius; x <= cx + radius; x++) {
            for (int z = cz - radius; z <= cz + radius; z++) {
                int distance = (x - cx) * (x - cx) + (z - cz) * (z - cz);
                if (distance >= (radius - 1) * (radius - 1) && distance <= radius * radius) {
                    BlockUtils.setBlock(world, x, y, z, (x + z) % 2 == 0 ? Material.POPPY : Material.RED_TULIP);
                }
            }
        }
    }

    private void planter(World world, int x, int y, int z) {
        BlockUtils.fill(world, x - 2, y, z - 2, x + 2, y, z + 2, Material.COARSE_DIRT);
        BlockUtils.setBlock(world, x, y + 1, z, Material.OAK_LEAVES);
        BlockUtils.setBlock(world, x - 1, y + 1, z, Material.POPPY);
        BlockUtils.setBlock(world, x + 1, y + 1, z, Material.RED_TULIP);
        BlockUtils.setBlock(world, x, y + 1, z - 1, Material.SHORT_GRASS);
        BlockUtils.setBlock(world, x, y + 1, z + 1, Material.DANDELION);
    }

    private void hedgePlanter(World world, int x, int y, int z, boolean eastWest) {
        if (eastWest) {
            BlockUtils.fill(world, x - 7, y, z - 1, x + 7, y, z + 1, Material.COARSE_DIRT);
            for (int dx = -6; dx <= 6; dx += 2) {
                BlockUtils.setBlock(world, x + dx, y + 1, z, Material.OAK_LEAVES);
                BlockUtils.setBlock(world, x + dx, y + 2, z, Material.AZALEA_LEAVES);
            }
            BlockUtils.setBlock(world, x - 3, y + 1, z - 1, Material.POPPY);
            BlockUtils.setBlock(world, x + 3, y + 1, z + 1, Material.RED_TULIP);
        } else {
            BlockUtils.fill(world, x - 1, y, z - 7, x + 1, y, z + 7, Material.COARSE_DIRT);
            for (int dz = -6; dz <= 6; dz += 2) {
                BlockUtils.setBlock(world, x, y + 1, z + dz, Material.OAK_LEAVES);
                BlockUtils.setBlock(world, x, y + 2, z + dz, Material.AZALEA_LEAVES);
            }
            BlockUtils.setBlock(world, x - 1, y + 1, z - 3, Material.POPPY);
            BlockUtils.setBlock(world, x + 1, y + 1, z + 3, Material.RED_TULIP);
        }
    }

    private void smallTree(World world, int x, int y, int z) {
        BlockUtils.setBlock(world, x, y, z, Material.DIRT);
        BlockUtils.fill(world, x, y + 1, z, x, y + 4, z, Material.SPRUCE_LOG);
        BlockUtils.fill(world, x - 2, y + 4, z - 2, x + 2, y + 4, z + 2, Material.SPRUCE_LEAVES);
        BlockUtils.fill(world, x - 1, y + 5, z - 1, x + 1, y + 5, z + 1, Material.SPRUCE_LEAVES);
        BlockUtils.setBlock(world, x, y + 6, z, Material.SPRUCE_LEAVES);
    }

    private void gardenStrip(World world, int minX, int y, int minZ, int maxX, int maxZ) {
        BlockUtils.fill(world, minX, y, minZ, maxX, y, maxZ, Material.COARSE_DIRT);
        for (int x = minX; x <= maxX; x++) {
            for (int z = minZ; z <= maxZ; z++) {
                if ((x + z) % 5 == 0) {
                    BlockUtils.setBlock(world, x, y + 1, z, Material.POPPY);
                } else if ((x + z) % 7 == 0) {
                    BlockUtils.setBlock(world, x, y + 1, z, Material.RED_TULIP);
                } else if ((x + z) % 11 == 0) {
                    BlockUtils.setBlock(world, x, y + 1, z, Material.SHORT_GRASS);
                }
            }
        }
    }

    private static int randomValue(int x, int z, int salt) {
        int n = x * 73428767 ^ z * 912931 ^ salt * 19349663;
        n ^= (n >>> 13);
        n *= 1274126177;
        return Math.floorMod(n, 100);
    }
}
