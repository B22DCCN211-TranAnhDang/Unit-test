import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const reviewTexts = [
  'Cuốn sách rất hay và ý nghĩa, mình đã học được rất nhiều điều từ đây.',
  'Nội dung sâu sắc, lối viết lôi cuốn. Rất đáng để đọc!',
  'Một tác phẩm tuyệt vời! Mình sẽ giới thiệu cho bạn bè cùng đọc.',
  'Sách trình bày đẹp, nội dung phong phú và thực tiễn.',
  'Hơi khó hiểu ở một số đoạn nhưng nhìn chung là một cuốn sách tốt.',
  'Kiến thức trong sách rất mới mẻ và thú vị. Cảm ơn tác giả.',
  'Đã đọc xong và cảm thấy rất hài lòng với số tiền bỏ ra.',
  'Sách gối đầu giường của mình, đọc đi đọc lại vẫn thấy hay.',
  'Phong cách viết rất cá tính, cốt truyện hấp dẫn đến tận trang cuối.',
  'Không quá ấn tượng nhưng cũng là một lựa chọn tốt để giải trí.',
];

async function seedReviews() {
  console.log('Starting to seed random reviews...');

  // Get all active users (READER)
  const users = await prisma.user.findMany({
    where: { role: 'READER', isDeleted: false },
    select: { id: true },
    take: 100, // Just take first 100 users for seeding
  });

  if (users.length === 0) {
    console.log('No readers found. Please seed users first.');
    return;
  }

  // Get all active books
  const books = await prisma.book.findMany({
    where: { isDeleted: false },
    select: { id: true, title: true },
  });

  if (books.length === 0) {
    console.log('No books found. Please seed books first.');
    return;
  }

  console.log(`Found ${users.length} users and ${books.length} books.`);

  let createdCount = 0;

  // For each book, generate 0-5 random reviews
  for (const book of books) {
    const numReviews = Math.floor(Math.random() * 6); // 0 to 5 reviews
    if (numReviews === 0) continue;

    const reviewsToCreate = [];
    
    // Pick unique random users for this book's reviews
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffledUsers.slice(0, numReviews);

    for (const user of selectedUsers) {
      const rating = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5 stars
      const text = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
      
      reviewsToCreate.push({
        userId: user.id,
        bookId: book.id,
        rating,
        reviewText: text,
        reviewDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)), // Random date in past
      });
    }

    await prisma.review.createMany({
      data: reviewsToCreate,
      skipDuplicates: true,
    });

    createdCount += reviewsToCreate.length;
    if (createdCount % 100 === 0) {
      console.log(`Created ${createdCount} reviews...`);
    }
  }

  console.log(`\nSuccessfully created ${createdCount} random reviews!`);
}

async function main() {
  try {
    await seedReviews();
  } catch (error) {
    console.error('Error seeding reviews:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
