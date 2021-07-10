
class NewDiscussionThreadRequest:
    def __init__(self):
        self.subject = None
        self.content = None
        self.position_held = None
        self.sentiment = None


class UpdateDiscussionThreadReplyRequest:
    def __init__(self):
        self.content = None
        self.position_held = None
        self.sentiment = None