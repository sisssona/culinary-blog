using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CulinaryBlog.Migrations
{
    /// <inheritdoc />
    public partial class AddShopProductKinds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DownloadToken",
                table: "ShopOrders",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "FileSent",
                table: "ShopOrders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "FileKey",
                table: "ShopOrderItems",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "ShopOrderItems",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "ShopOrderItems",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "stock");

            migrationBuilder.AddColumn<string>(
                name: "ExternalUrl",
                table: "Products",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileKey",
                table: "Products",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "Products",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "Products",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "stock");

            migrationBuilder.CreateTable(
                name: "ShopSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AccountName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Iban = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    BankName = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    PaymentNote = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShopSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShopSettings");

            migrationBuilder.DropColumn(
                name: "DownloadToken",
                table: "ShopOrders");

            migrationBuilder.DropColumn(
                name: "FileSent",
                table: "ShopOrders");

            migrationBuilder.DropColumn(
                name: "FileKey",
                table: "ShopOrderItems");

            migrationBuilder.DropColumn(
                name: "FileName",
                table: "ShopOrderItems");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "ShopOrderItems");

            migrationBuilder.DropColumn(
                name: "ExternalUrl",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "FileKey",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "FileName",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "Products");
        }
    }
}
