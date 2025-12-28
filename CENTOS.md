## Linux Copy One Hard Disk to Another Using dd Command

```bash

You can copy the disk in raw format using the dd command. It will copy the partition table, bootloader, data, and all partitions within this disk. For example, you can copy /dev/sda to /dev/sdb (same size) using the following dd command. Please note that the dd should be complete with no errors on screen, except output the number of records read and written. There is also GNU/rescue command, which is far more robust than the standard dd command provided with Linux. Let us see how to copy one hard disk to another in Linux using the dd, dcfldd, and ddresuce commands.
Tutorial details
Difficulty level	Advanced
Root privileges	Yes
Requirements	Linux terminal
Category	Disk Management
OS compatibility	AlmaLinux • Alpine • Amazon Linux • Arch • BSD • CentOS • Debian • Fedora • Linux • macOS • Mint • Mint • openSUSE • Pop!_OS • RHEL • Rocky • Slackware • Stream • SUSE • Ubuntu • Unix
Est. reading time	5 minutes
⚠️ WARNING! Be careful with the source and destination disk names when using the Linux GNU dd or ddrescue command. Wrong disk names will destroy all existing data. You must always keep verified backups of all critical data. Neither nixCraft nor the author can be held responsible for any data loss.
Copying and cloning hard disk using dd command on Linux
`
The best practice is to boot from a USB disk or live Linux CD/DVD such as Knoppix. This ensures that all data on the source disk is in a cold state and will not be modified during the copying process, thus reducing errors. It is also a good idea to run fsck on the input disk before cloning stars to check and repair the file system. The following commands are intended for cloning hard drives (SSD or HDD) of the same size. First, open the terminal app or shell prompt. Next, log in as the root user using either sudo command or su command. For instance:
`sudo -i
# OR #
su -

The syntax for dd command is as follows:
`dd if=/dev/SOURCE of=/dev/DESTINATION
dd if=/dev/SOURCE of=/dev/DESTINATION option1 option2
dd if=/dev/SOURCE of=/dev/DESTINATION bs=1M status=progress`

Step 1: Check source disk named /dev/sda for errors using the fsck command. Ensures that /dev/sda is not mounted; hence, it must boot from a live USB or CD/DVD. For example, assume the partition name /dev/sda1 with ext4 filesystem:
`fdisk -l /dev/sda #list partitions
umount /dev/sda #unmount it
fsck.ext4 /dev/sda1 #for EXT4 fs
fsck.xfs /dev/sda1 #for XFS fs`

Step 2: For example, here is how to clone /dev/sda to /dev/sdb:
dd if=/dev/sda of=/dev/sdb bs=1M status=progress

Where,

`if=/dev/sda` : Input disk (source)
`of=/dev/sdb`: Output disk (destination)
bs=1M: Sets the block size to 1 megabytes. You must adjust this number based on your system’s bus and disk performance.
status=progress: Displays a progress bar during the Linux cloning process using dd.
You can clone a drive to another drive with 2 MiB block and ignore error as follows:
`dd if=/dev/sda of=/dev/sdb bs=2M conv=noerror status=progress`

Step 3: When dd completes cloning, it is a good practice to run fsck to check the DESTINATION disk named /dev/sdb1 to avoid any surprises. For example:
`fsck.ext4 /dev/sdb1 #for EXT4 fs
fsck.xfs /dev/sdb1 #for XFS fs`

Linux Copy One Hard Disk to Another Using GNU ddresuce Command

Prerequisite
By default, ddrescue and dcfldd command may not be installed on your system. Hence, use the apk command on Alpine Linux, dnf command/yum command on RHEL & co, apt command/apt-get command on Debian, Ubuntu & co, zypper command on SUSE/OpenSUSE, pacman command on Arch Linux to install the ddrescue and dcfldd.
The GNU/ddrescue is a data recovery tool that reads data from damaged block devices such as hard disks. It can also clone hard drives in Linux. The syntax is as follows:
`ddrescue --force --no-scrape /dev/SORUCE /dev/DESTINATION /path/to/log.txt`

OR
`ddrescue --force --no-scrape /dev/SORUCE /dev/DESTINATION /path/to/mapfile`

For example, here is how to clone /dev/sda to /dev/sdb using the ddrescue
ddrescue --force --no-scrape /dev/sda /dev/sdb mapfile

Here is a full example to clone /dev/sda to /dev/sdb:
`fdisk -l /dev/sda
e2fsck.ext4 -v -f /dev/sda1
ddrescue -f -r3 /dev/sda /dev/sdb mapfile
fdisk -l /dev/sdb
e2fsck.ext4 -v -f /dev/sdb1
`
Where,
`fdisk -l /dev/sda` : List partitions on Linux disk named /dev/sda.
`e2fsck.ext4 -v -f /dev/sda1` : Check /dev/sda1 for errors.`

`ddrescue -f -r3 /dev/sda /dev/sdb`

mapfile : 'Clone the /dev/sda to /dev/sdb using mapfile. The mapfile will be created and it will be used to resume cloning operations. The -f/--force overwrite output device or partition such as /dev/sdb. The ddrescue command will exit after 3 retry passes to read or write data. This is useful for damaged disks. The -n or --no-scrape option will skip the scraping phase.
If you are dealing with a failing hard disk drive on Linux or require more advanced features for disk cloning, please consider using GNU ddrescue, which is designed for data recovery. See how to test if Linux disk going bad or failing using the CLI and GUI tools for more information.

Say hello to dcfldd enhanced version of dd for security and forensics

The dcfldd command was initially developed at the Department of Defense Computer Forensics Lab (DCFL). This tool is based on the dd with the following additional features:

One of the key features of dcfldd is its ability to ensure data integrity with on-the-fly hashing. This feature provides a layer of security as the input data is being transferred to another disk.
It updates the user on its progress in terms of the amount of data transferred and how much longer the operation will take.
dcfldd can output to multiple files or disks at the same time.
When dd uses a default block size (bs, ibs, obs) of 512 bytes, dcfldd uses 32768 bytes (32 KiB), which is HUGELY more efficient.
Examples

Let us copy a disk (/dev/sda) to a raw image file and hash the image using SHA256:
`dcfldd if=/dev/sda of=/path/to/sda-disk.img hash=sha256 hashlog=/path/to/file.hash`

Let us validate the image file named ` /path/to/sda-disk.img` against the original source /dev/sda:

`dcfldd if=/dev/sda vf=/path/to/sda-disk.img`

In this example, clone the /dev/sda (source) to /dev/sdb (destination):
  `dcfldd if=/dev/sda of=/dev/sdb bs=512k statusinterval=30 hash=sha256 hashlog=/path/to/hashlog.sha256.txt`
```

---
