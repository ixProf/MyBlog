using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<BlogPost> BlogPosts => Set<BlogPost>();
    public DbSet<AcademicNote> AcademicNotes => Set<AcademicNote>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<AdminLoginAttempt> AdminLoginAttempts => Set<AdminLoginAttempt>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<SeedHistory> SeedHistories => Set<SeedHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Username).IsUnique();
        });

        modelBuilder.Entity<BlogPost>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
        });

        modelBuilder.Entity<AcademicNote>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
        });

        modelBuilder.Entity<Subject>(entity =>
        {
            entity.ToTable("subjects");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<Question>(entity =>
        {
            entity.ToTable("questions");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.DisplayNumber).IsUnique();
        });

        modelBuilder.Entity<AdminLoginAttempt>(entity =>
        {
            entity.ToTable("admin_login_attempts");
            entity.HasKey(e => e.Ip);
        });

        modelBuilder.Entity<Profile>(entity =>
        {
            entity.ToTable("profile");
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<SeedHistory>(entity =>
        {
            entity.ToTable("seed_history");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();
        });
    }
}